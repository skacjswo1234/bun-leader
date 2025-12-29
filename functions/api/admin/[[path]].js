/**
 * 관리자 API - Cloudflare Pages Functions
 * /api/admin/* 동적 경로 처리
 */
import { corsHeaders } from '../../_utils/cors.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const method = request.method;
  const path = params.path || '';

  // CORS preflight 처리
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 사이트 목록 조회: /api/admin/sites
    if (path === 'sites' && method === 'GET') {
      const result = await env.DB.prepare('SELECT * FROM sites ORDER BY created_at DESC').all();
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

      await env.DB.prepare(
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

      await env.DB.prepare(
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
      const stats = await env.DB.prepare(`
        SELECT 
          site_id,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM inquiries
        GROUP BY site_id
      `).all();

      const totalStats = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
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

    // 문의 목록 조회: /api/admin/inquiries
    if (path === 'inquiries' && method === 'GET') {
      const site_id = url.searchParams.get('site_id');
      const status = url.searchParams.get('status');
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

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const result = await env.DB.prepare(query)
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

      const countResult = await env.DB.prepare(countQuery)
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

    // 문의 상태 업데이트: /api/admin/inquiries/:id
    const updateMatch = path.match(/^inquiries\/(\d+)$/);
    if (updateMatch && method === 'PUT') {
      const id = updateMatch[1];
      const body = await request.json();
      const { status } = body;

      if (!status || !['pending', 'contacted', 'completed'].includes(status)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid status' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await env.DB.prepare(
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

    // 문의 삭제: /api/admin/inquiries/:id
    const deleteMatch = path.match(/^inquiries\/(\d+)$/);
    if (deleteMatch && method === 'DELETE') {
      const id = deleteMatch[1];

      await env.DB.prepare('DELETE FROM inquiries WHERE id = ?')
        .bind(id)
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

