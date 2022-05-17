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
    a."level",
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

-- public.vw_tasks_allusers source

CREATE OR REPLACE VIEW public.vw_tasks_allusers
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

  -- public.vw_tasks_allva source

CREATE OR REPLACE VIEW public.vw_tasks_allva
AS SELECT b.name AS groups,
    concat(a.first_name, ' ', a.last_name) AS name,
    a.address,
    a.tel,
    a.group_id,
    b.name AS groups_name,
    to_char(timezone('Asia/Bangkok'::text, a.created_at), 'DD Mon YYYY HH24:MI:SS'::text) AS created_at,
    a.id
   FROM users a
     JOIN groups b ON a.group_id = b.id
  ORDER BY a.updated_at DESC;

  -- public.vw_tasks_volunteer source

CREATE OR REPLACE VIEW public.vw_tasks_volunteer
AS SELECT concat(e.first_name, ' ', e.last_name) AS name,
    concat(c.first_name, ' ', c.last_name) AS volunteer_name,
    d.color,
    f.address_from_gmap AS address,
    c.tel,
    a.remark,
    a.level,
    d.color AS color_level,
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