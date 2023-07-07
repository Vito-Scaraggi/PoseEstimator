-- Table: public.user

-- DROP TABLE IF EXISTS public."user";

CREATE TABLE IF NOT EXISTS public."user"
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    name text COLLATE pg_catalog."default" NOT NULL,
    surname text COLLATE pg_catalog."default" NOT NULL,
    email text COLLATE pg_catalog."default" NOT NULL UNIQUE,
    password text COLLATE pg_catalog."default" NOT NULL,
    "salt" text COLLATE pg_catalog."default" NOT NULL,
    credit real NOT NULL DEFAULT 500,
    admin boolean NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NULL,
    "updatedAt" TIMESTAMP DEFAULT NULL,
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
    name text COLLATE pg_catalog."default" NOT NULL UNIQUE,
    tags text[] COLLATE pg_catalog."default",
    format text COLLATE pg_catalog."default" DEFAULT 'png',
    "userID" integer NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NULL,
    "updatedAt" TIMESTAMP DEFAULT NULL,
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
    "createdAt" TIMESTAMP DEFAULT NULL,
    "updatedAt" TIMESTAMP DEFAULT NULL,
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
    name text COLLATE pg_catalog."default" NOT NULL UNIQUE,
    "createdAt" TIMESTAMP DEFAULT NULL,
    "updatedAt" TIMESTAMP DEFAULT NULL,
    CONSTRAINT model_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.model
    OWNER to "user";



/* SEEDING */


/* password di Luca : "luca"
   password di vito : "vito"
   password di admin : "admin"
*/

INSERT INTO public."user"(
	 name, surname, email, password, salt, credit, admin)
	VALUES ('Vito', 'Scaraggi','vito@vito.it', 'e220164f41888d58f385856cb6a245ff427544b65d00eb67360ad33f8b445506', '1e887b0f56852632c97454e2d0b47165' , 100, false),
            ('Luca', 'Guidi','luca@luca.it', 'e4f8e1ce02cb28c62bf24b5eda40b39258d760be8b2767b7d50a3963394c4820', '392b6ae66271cdd01349316e979a3891' , 100, false),
			('Admin', 'Admin', 'admin@admin.it','152a6186c987f8a9cfa8402034dd3b53b9466d9861a713818df3728da10865e9','da91f972543a640ec5ed1df52c176e6f', 200, true);