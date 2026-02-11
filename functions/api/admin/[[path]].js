/**
 * 관리자 API - Cloudflare Pages Functions
 * /api/admin/* 동적 경로 처리
 */
import { corsHeaders } from '../../_utils/cors.js';
import { checkAuth, authErrorResponse } from '../../_utils/auth.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const method = request.method;
  // path가 배열일 수 있으므로 문자열로 변환
  const path = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');

  // CORS preflight 처리
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 인증 체크
  if (!checkAuth(request)) {
    return authErrorResponse();
  }

  try {
    // 데이터베이스 바인딩 확인
    const db = env.DB || env['bun-leader-db'];
    if (!db) {
      return new Response(JSON.stringify({ 
        error: 'Database binding not found. Please check D1 binding name in Cloudflare Pages settings.',
        availableBindings: Object.keys(env).filter(key => key.includes('DB') || key.includes('db') || key.includes('database'))
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 사이트 목록 조회: /api/admin/sites
    if (path === 'sites' && method === 'GET') {
      const result = await db.prepare('SELECT * FROM sites ORDER BY created_at DESC').all();
      return new Response(JSON.stringify({ 
        success: true,
        data: result.results 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 사이트 생성: /api/admin/sites
    if (path === 'sites' && method === 'POST') {
      const body = await request.json();
      const { id, name, domain, config } = body;

      if (!id || !name) {
        return new Response(JSON.stringify({ 
          error: 'id and name are required' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await db.prepare(
        `INSERT INTO sites (id, name, domain, config) VALUES (?, ?, ?, ?)`
      )
      .bind(id, name, domain || null, config || null)
      .run();

      return new Response(JSON.stringify({ 
        success: true 
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 사이트 수정: /api/admin/sites/:id
    const siteUpdateMatch = path.match(/^sites\/([^\/]+)$/);
    if (siteUpdateMatch && method === 'PUT') {
      const siteId = siteUpdateMatch[1];
      const body = await request.json();
      const { name, domain, config } = body;

      await db.prepare(
        `UPDATE sites SET name = ?, domain = ?, config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      )
      .bind(name || null, domain || null, config || null, siteId)
      .run();

      return new Response(JSON.stringify({ 
        success: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 통계 조회: /api/admin/stats
    if (path === 'stats' && method === 'GET') {
      const stats = await db.prepare(`
        SELECT 
          site_id,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM inquiries
        GROUP BY site_id
      `).all();

      const totalStats = await db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
          SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'advertising' THEN 1 ELSE 0 END) as advertising,
          SUM(CASE WHEN status = 'partner' THEN 1 ELSE 0 END) as partner
        FROM inquiries
      `).first();

      return new Response(JSON.stringify({ 
        success: true,
        data: {
          bySite: stats.results,
          total: totalStats
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 문의 목록 조회: /api/admin/inquiries (검색 기능 포함)
    if (path === 'inquiries' && method === 'GET') {
      const site_id = url.searchParams.get('site_id');
      const status = url.searchParams.get('status');
      const manageStatus = url.searchParams.get('manage_status');
      const paymentStatus = url.searchParams.get('payment_status');
      const search = url.searchParams.get('search'); // 검색어
      const searchField = url.searchParams.get('search_field') || 'all'; // 검색 항목 (all, name, contact, type)
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM inquiries WHERE 1=1';
      let params = [];

      if (site_id) {
        query += ' AND site_id = ?';
        params.push(site_id);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      if (manageStatus) {
        // custom_fields JSON 내 manage_status 값 필터
        query += ' AND custom_fields LIKE ?';
        params.push(`%"manage_status":"${manageStatus}"%`);
      }

      if (paymentStatus && site_id === 'bun-partner') {
        // 입금미완료: 값이 '입금미완료'이거나, payment_status 키가 없으면 디폴트 입금미완료로 간주
        if (paymentStatus === '입금미완료') {
          query += ' AND (custom_fields IS NULL OR custom_fields NOT LIKE ? OR custom_fields LIKE ?)';
          params.push('%"payment_status"%', `%"payment_status":"입금미완료"%`);
        } else {
          query += ' AND custom_fields LIKE ?';
          params.push(`%"payment_status":"${paymentStatus}"%`);
        }
      }

      // 검색 기능
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        if (searchField === 'name') {
          query += ' AND name LIKE ?';
          params.push(searchTerm);
        } else if (searchField === 'contact') {
          query += ' AND contact LIKE ?';
          params.push(searchTerm);
        } else if (searchField === 'type') {
          query += ' AND custom_fields LIKE ?';
          params.push(`%${search.trim()}%`);
        } else if (searchField === 'referrer') {
          // 추천인 검색: custom_fields의 referrer 필드 검색
          // JSON에서 referrer 필드 값 검색 (여러 패턴 시도)
          query += ' AND (custom_fields LIKE ? OR custom_fields LIKE ? OR custom_fields LIKE ?)';
          const searchTerm = search.trim();
          // 패턴 1: "referrer":"검색어" (공백 없음)
          // 패턴 2: "referrer": "검색어" (공백 있음)  
          // 패턴 3: referrer 키와 검색어가 모두 포함된 경우 (더 유연)
          params.push(`%"referrer":"%${searchTerm}%"`);
          params.push(`%"referrer": "%${searchTerm}%"`);
          params.push(`%"referrer"%${searchTerm}%`);
        } else {
          // all: 이름, 연락처, custom_fields(문의타입, 추천인 포함) 모두 검색
          query += ' AND (name LIKE ? OR contact LIKE ? OR custom_fields LIKE ?)';
          params.push(searchTerm, searchTerm, `%${search.trim()}%`);
        }
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const result = await db.prepare(query)
        .bind(...params)
        .all();

      // 전체 개수 조회
      let countQuery = 'SELECT COUNT(*) as total FROM inquiries WHERE 1=1';
      let countParams = [];
      
      if (site_id) {
        countQuery += ' AND site_id = ?';
        countParams.push(site_id);
      }
      
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }

      if (manageStatus) {
        countQuery += ' AND custom_fields LIKE ?';
        countParams.push(`%"manage_status":"${manageStatus}"%`);
      }

      if (paymentStatus && site_id === 'bun-partner') {
        if (paymentStatus === '입금미완료') {
          countQuery += ' AND (custom_fields IS NULL OR custom_fields NOT LIKE ? OR custom_fields LIKE ?)';
          countParams.push('%"payment_status"%', `%"payment_status":"입금미완료"%`);
        } else {
          countQuery += ' AND custom_fields LIKE ?';
          countParams.push(`%"payment_status":"${paymentStatus}"%`);
        }
      }

      // 검색 조건도 동일하게 적용
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        if (searchField === 'name') {
          countQuery += ' AND name LIKE ?';
          countParams.push(searchTerm);
        } else if (searchField === 'contact') {
          countQuery += ' AND contact LIKE ?';
          countParams.push(searchTerm);
        } else if (searchField === 'type') {
          countQuery += ' AND custom_fields LIKE ?';
          countParams.push(`%${search.trim()}%`);
        } else if (searchField === 'referrer') {
          // 추천인 검색: custom_fields의 referrer 필드 검색
          // JSON에서 referrer 필드 값 검색 (여러 패턴 시도)
          countQuery += ' AND (custom_fields LIKE ? OR custom_fields LIKE ? OR custom_fields LIKE ?)';
          const searchTerm = search.trim();
          // 패턴 1: "referrer":"검색어" (공백 없음)
          // 패턴 2: "referrer": "검색어" (공백 있음)
          // 패턴 3: referrer 키와 검색어가 모두 포함된 경우 (더 유연)
          countParams.push(`%"referrer":"%${searchTerm}%"`);
          countParams.push(`%"referrer": "%${searchTerm}%"`);
          countParams.push(`%"referrer"%${searchTerm}%`);
        } else {
          countQuery += ' AND (name LIKE ? OR contact LIKE ? OR custom_fields LIKE ?)';
          countParams.push(searchTerm, searchTerm, `%${search.trim()}%`);
        }
      }

      const countResult = await db.prepare(countQuery)
        .bind(...countParams)
        .first();

      return new Response(JSON.stringify({ 
        success: true,
        data: result.results,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 개별 문의 조회: /api/admin/inquiries/:id
    const getInquiryMatch = path.match(/^inquiries\/(\d+)$/);
    if (getInquiryMatch && method === 'GET') {
      const id = getInquiryMatch[1];
      
      const inquiry = await db.prepare('SELECT * FROM inquiries WHERE id = ?')
        .bind(id)
        .first();

      if (!inquiry) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Inquiry not found' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        success: true,
        data: inquiry 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 문의 상태 업데이트 및 내용 수정: /api/admin/inquiries/:id
    const updateMatch = path.match(/^inquiries\/(\d+)$/);
    if (updateMatch && method === 'PUT') {
      const id = updateMatch[1];
      const body = await request.json();
      const { status, name, contact, message, custom_fields, notes } = body;

      // 상태만 업데이트하는 경우
      if (status && !name && !contact && !message && !custom_fields && notes === undefined) {
        if (!['pending', 'contacted', 'reviewing', 'rejected', 'completed', 'advertising', 'partner'].includes(status)) {
          return new Response(JSON.stringify({ 
            error: 'Invalid status' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        await db.prepare(
          `UPDATE inquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        )
        .bind(status, id)
        .run();

        return new Response(JSON.stringify({ 
          success: true 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 문의 내용 수정 (이름, 연락처, 메시지, custom_fields, notes)
      let updateFields = [];
      let updateParams = [];

      if (status) {
        updateFields.push('status = ?');
        updateParams.push(status);
      }
      if (name !== undefined) {
        updateFields.push('name = ?');
        updateParams.push(name);
      }
      if (contact !== undefined) {
        updateFields.push('contact = ?');
        updateParams.push(contact);
      }
      if (message !== undefined) {
        updateFields.push('message = ?');
        updateParams.push(message);
      }
      if (custom_fields !== undefined) {
        const customFieldsJson = typeof custom_fields === 'string' 
          ? custom_fields 
          : JSON.stringify(custom_fields);
        updateFields.push('custom_fields = ?');
        updateParams.push(customFieldsJson);
      }
      if (notes !== undefined) {
        // notes를 custom_fields에 저장 (기존 custom_fields와 병합)
        const currentInquiry = await db.prepare('SELECT custom_fields FROM inquiries WHERE id = ?')
          .bind(id)
          .first();
        
        let currentCustomFields = {};
        if (currentInquiry && currentInquiry.custom_fields) {
          try {
            currentCustomFields = typeof currentInquiry.custom_fields === 'string'
              ? JSON.parse(currentInquiry.custom_fields)
              : currentInquiry.custom_fields;
          } catch (e) {
            console.error('Failed to parse custom_fields:', e);
          }
        }
        
        currentCustomFields.admin_notes = notes;
        const updatedCustomFieldsJson = JSON.stringify(currentCustomFields);
        updateFields.push('custom_fields = ?');
        updateParams.push(updatedCustomFieldsJson);
      }

      if (updateFields.length === 0) {
        return new Response(JSON.stringify({ 
          error: 'No fields to update' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateParams.push(id);

      await db.prepare(
        `UPDATE inquiries SET ${updateFields.join(', ')} WHERE id = ?`
      )
      .bind(...updateParams)
      .run();

      return new Response(JSON.stringify({ 
        success: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 문의 삭제: /api/admin/inquiries/:id
    const deleteMatch = path.match(/^inquiries\/(\d+)$/);
    if (deleteMatch && method === 'DELETE') {
      const id = deleteMatch[1];

      await db.prepare('DELETE FROM inquiries WHERE id = ?')
        .bind(id)
        .run();

      return new Response(JSON.stringify({ 
        success: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 관리자 비밀번호 변경: /api/admin/password
    if (path === 'password' && method === 'PUT') {
      const body = await request.json();
      const { oldPassword, newPassword } = body;

      if (!oldPassword || !newPassword) {
        return new Response(JSON.stringify({ 
          success: false,
          error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 현재 비밀번호 확인
      const admin = await db.prepare(
        'SELECT password FROM admins WHERE username = ? LIMIT 1'
      )
      .bind('admin')
      .first();

      if (!admin || admin.password !== oldPassword) {
        return new Response(JSON.stringify({ 
          success: false,
          error: '현재 비밀번호가 올바르지 않습니다.' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 비밀번호 변경
      await db.prepare(
        'UPDATE admins SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?'
      )
      .bind(newPassword, 'admin')
      .run();

      return new Response(JSON.stringify({ 
        success: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { 
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    console.error('Admin API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

