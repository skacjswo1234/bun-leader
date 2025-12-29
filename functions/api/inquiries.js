/**
 * 문의 API - Cloudflare Pages Functions
 * /api/inquiries 엔드포인트
 */
import { corsHeaders } from '../_utils/cors.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // CORS preflight 처리
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (method === 'POST') {
      // 문의 생성
      const body = await request.json();
      const { site_id, name, contact, message, custom_fields } = body;

      if (!site_id || !name || !contact) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: site_id, name, contact are required' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // custom_fields가 객체로 오면 JSON 문자열로 변환
      let customFieldsJson = null;
      if (custom_fields) {
        customFieldsJson = typeof custom_fields === 'string' 
          ? custom_fields 
          : JSON.stringify(custom_fields);
      }

      const result = await env.DB.prepare(
        `INSERT INTO inquiries (site_id, name, contact, message, custom_fields, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`
      )
      .bind(site_id, name, contact, message || null, customFieldsJson)
      .run();

      return new Response(JSON.stringify({ 
        success: true,
        id: result.meta.last_row_id 
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (method === 'GET') {
      // 문의 조회
      const site_id = url.searchParams.get('site_id');
      
      let query = 'SELECT * FROM inquiries';
      let params = [];

      if (site_id) {
        query += ' WHERE site_id = ?';
        params.push(site_id);
      }

      query += ' ORDER BY created_at DESC LIMIT 100';

      const result = await env.DB.prepare(query)
        .bind(...params)
        .all();

      return new Response(JSON.stringify({ 
        success: true,
        data: result.results 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method Not Allowed', { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    console.error('Inquiries API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

