--ที่อยู่
CREATE TABLE public.address (
	id serial4 NOT NULL,
	"position" json NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	user_id uuid NULL,
	address_from_gmap varchar(255) NULL,
	address_from_user varchar(255) NULL,
	CONSTRAINT address_pkey PRIMARY KEY (id)
);

--Role User
CREATE TABLE public."groups" (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	"name" varchar NULL,
	active_flag bool NULL DEFAULT true,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT groups_pkey PRIMARY KEY (id)
);

--Status Task
CREATE TABLE public.status (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	"name" varchar(255) NULL,
	color varchar(255) NULL,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT status_pkey PRIMARY KEY (id)
);

--Tasks
CREATE TABLE public.tasks (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	remark varchar(255) NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	user_id uuid NULL,
	status_id uuid NULL,
	img_id uuid NULL,
	cancel_detail varchar(255) NULL,
	"level" varchar(255) NULL,
	address_id int4 NULL,
	volunteer_id uuid NULL,
	congenital_disease varchar(255) NULL,
	requirement json NULL,
	treatment_location varchar(255) NULL,
	form json NULL,
	help_detail json NULL,
	is_care_until_end bool NULL DEFAULT false,
	CONSTRAINT tasks_pkey PRIMARY KEY (id),
	CONSTRAINT tasks_fk FOREIGN KEY (user_id) REFERENCES public.users(id)
);

--Image
CREATE TABLE public.uploadimages (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	day_of_visit varchar(255) NULL,
	hospital varchar(255) NOT NULL,
	image_rtpcr text NULL,
	image_medical text NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	user_id uuid NULL,
	CONSTRAINT uploadimages_pkey PRIMARY KEY (id)
);

--User All
CREATE TABLE public.users (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	first_name varchar(255) NULL,
	last_name varchar(255) NULL,
	email varchar(255) NULL,
	"password" varchar(255) NULL,
	tel varchar(255) NULL,
	address varchar(255) NULL,
	lat_lng varchar(255) NULL,
	status varchar(255) NULL,
	"type" varchar(255) NULL,
	created_at timestamptz NOT NULL,
	updated_at timestamptz NOT NULL,
	group_id uuid NULL,
	salvor_id uuid NULL,
	current_address int4 NULL,
	CONSTRAINT users_pkey PRIMARY KEY (id)
);