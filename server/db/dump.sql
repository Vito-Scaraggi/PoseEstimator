-- Table: public.user

-- DROP TABLE IF EXISTS public."user";

CREATE TABLE IF NOT EXISTS public."user"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    name text COLLATE pg_catalog."default" NOT NULL,
    surname text COLLATE pg_catalog."default" NOT NULL,
    email text COLLATE pg_catalog."default" NOT NULL,
    password text COLLATE pg_catalog."default" NOT NULL,
    credit real NOT NULL DEFAULT 0,
    admin boolean NOT NULL DEFAULT false,
    CONSTRAINT user_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."user"
    OWNER to "user";

-- Table: public.dataset

-- DROP TABLE IF EXISTS public.dataset;

CREATE TABLE IF NOT EXISTS public.dataset
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    name text COLLATE pg_catalog."default" NOT NULL,
    tags text[] COLLATE pg_catalog."default",
    "userID" integer NOT NULL,
    CONSTRAINT dataset_pkey PRIMARY KEY (id),
    CONSTRAINT user_id FOREIGN KEY ("userID")
        REFERENCES public."user" (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.dataset
    OWNER to "user";

-- Table: public.image

-- DROP TABLE IF EXISTS public.image;

CREATE TABLE IF NOT EXISTS public.image
(
    uuid text COLLATE pg_catalog."default" NOT NULL,
    file_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    name text COLLATE pg_catalog."default" NOT NULL,
    bbox integer[] NOT NULL,
    "datasetID" integer NOT NULL,
    CONSTRAINT image_pkey PRIMARY KEY (uuid),
    CONSTRAINT dataset_id FOREIGN KEY ("datasetID")
        REFERENCES public.dataset (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.image
    OWNER to "user";

-- Table: public.model

-- DROP TABLE IF EXISTS public.model;

CREATE TABLE IF NOT EXISTS public.model
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    name text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT model_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.model
    OWNER to "user";



/* SEEDING */


INSERT INTO public."user"(
	 name, surname, email, password, credit, admin)
	VALUES ('Luca', 'Guidi','luca@prova.it', 'password',10,false),
			('Pippo', 'Baudo', 'pippo@gm.it','password',5,false);