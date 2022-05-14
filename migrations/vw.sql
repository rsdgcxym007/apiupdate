--VW Task
CREATE OR REPLACE VIEW public.vw_tasks
AS SELECT concat(c.first_name, ' ', c.last_name) AS name,
    d.color,
    c.address,
    c.tel,
    a.remark,
    d.name AS status_name,
    a.user_id,
    to_char(timezone('Asia/Bangkok'::text, a.created_at), 'DD Mon YYYY HH24:MI:SS'::text) AS created_at,
    a.id
   FROM tasks a
     JOIN users c ON a.user_id = c.id
     JOIN status d ON a.status_id = d.id
  ORDER BY a.updated_at DESC;

--VW Detail Task ทั้งหมด
CREATE OR REPLACE VIEW public.vw_tasks_all_detail
AS SELECT a.id,
    a.user_id,
    concat(b.first_name, ' ', b.last_name) AS name,
    b.tel,
    d.name AS status_name,
    d.color,
    a.remark,
    c."position",
    c.address_from_gmap,
    c.address_from_user,
    to_char(timezone('Asia/Bangkok'::text, a.created_at), 'DD Mon YYYY HH24:MI:SS'::text) AS created_at
   FROM tasks a
     JOIN users b ON a.user_id = b.id
     JOIN address c ON a.address_id = c.id
     JOIN status d ON a.status_id = d.id
  ORDER BY a.created_at DESC;

  --VW Task + ข้อมูลอาสา
CREATE OR REPLACE VIEW public.vw_tasks_volunteer
AS SELECT concat(e.first_name, ' ', e.last_name) AS name,
    concat(c.first_name, ' ', c.last_name) AS volunteer_name,
    d.color,
    f.address_from_gmap AS address,
    c.tel,
    a.remark,
    d.name AS status_name,
    a.volunteer_id,
    to_char(timezone('Asia/Bangkok'::text, a.created_at), 'DD Mon YYYY HH24:MI:SS'::text) AS created_at,
    a.id
   FROM tasks a
     JOIN users c ON a.volunteer_id = c.id
     JOIN status d ON a.status_id = d.id
     JOIN users e ON a.user_id = e.id
     JOIN address f ON a.address_id = f.id
  ORDER BY a.updated_at DESC;