--
-- PostgreSQL database dump
--

\restrict TZVahS9yO6a2v9TdMWWQMPNB9HRLkcmZ1cH2lYENK9GxhHy6nd7vujA5Foql7wI

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.3

-- Started on 2026-07-24 22:28:12 PDT

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 3878 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16389)
-- Name: boards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.boards (
    id integer CONSTRAINT board_id_not_null NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    ended_at timestamp without time zone,
    winner_id integer,
    host_id integer,
    title character varying(255),
    code character varying(255)
);


ALTER TABLE public.boards OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16395)
-- Name: board_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.board_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.board_id_seq OWNER TO postgres;

--
-- TOC entry 3879 (class 0 OID 0)
-- Dependencies: 221
-- Name: board_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.board_id_seq OWNED BY public.boards.id;


--
-- TOC entry 222 (class 1259 OID 16396)
-- Name: squares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.squares (
    id integer CONSTRAINT board_squares_id_not_null NOT NULL,
    board_id integer CONSTRAINT board_squares_board_id_not_null NOT NULL,
    goal character varying(255),
    index integer,
    player_id integer
);


ALTER TABLE public.squares OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16404)
-- Name: board_squares_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.board_squares_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.board_squares_id_seq OWNER TO postgres;

--
-- TOC entry 3880 (class 0 OID 0)
-- Dependencies: 223
-- Name: board_squares_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.board_squares_id_seq OWNED BY public.squares.id;


--
-- TOC entry 224 (class 1259 OID 16405)
-- Name: players; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.players (
    id integer CONSTRAINT game_players_id_not_null NOT NULL,
    user_id integer CONSTRAINT game_players_player_id_not_null NOT NULL,
    board_id integer CONSTRAINT game_players_board_id_not_null NOT NULL,
    joined_at timestamp without time zone DEFAULT now(),
    ready boolean
);


ALTER TABLE public.players OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16412)
-- Name: game_players_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.game_players_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.game_players_id_seq OWNER TO postgres;

--
-- TOC entry 3881 (class 0 OID 0)
-- Dependencies: 225
-- Name: game_players_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.game_players_id_seq OWNED BY public.players.id;


--
-- TOC entry 226 (class 1259 OID 16413)
-- Name: marker; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marker (
    id integer CONSTRAINT player_marks_id_not_null NOT NULL,
    player_id integer CONSTRAINT player_marks_player_id_not_null NOT NULL,
    square_id integer CONSTRAINT player_marks_square_id_not_null NOT NULL,
    marked_at timestamp without time zone DEFAULT now(),
    board_id integer
);


ALTER TABLE public.marker OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16420)
-- Name: player_marks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.player_marks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.player_marks_id_seq OWNER TO postgres;

--
-- TOC entry 3882 (class 0 OID 0)
-- Dependencies: 227
-- Name: player_marks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.player_marks_id_seq OWNED BY public.marker.id;


--
-- TOC entry 228 (class 1259 OID 16421)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer CONSTRAINT players_id_not_null NOT NULL,
    name character varying(100) CONSTRAINT players_name_not_null NOT NULL,
    email character varying(255) CONSTRAINT players_email_not_null NOT NULL,
    password character varying(255) CONSTRAINT players_password_not_null NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16431)
-- Name: players_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.players_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.players_id_seq OWNER TO postgres;

--
-- TOC entry 3883 (class 0 OID 0)
-- Dependencies: 229
-- Name: players_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.players_id_seq OWNED BY public.users.id;


--
-- TOC entry 3691 (class 2604 OID 16432)
-- Name: boards id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boards ALTER COLUMN id SET DEFAULT nextval('public.board_id_seq'::regclass);


--
-- TOC entry 3697 (class 2604 OID 16433)
-- Name: marker id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marker ALTER COLUMN id SET DEFAULT nextval('public.player_marks_id_seq'::regclass);


--
-- TOC entry 3695 (class 2604 OID 16434)
-- Name: players id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players ALTER COLUMN id SET DEFAULT nextval('public.game_players_id_seq'::regclass);


--
-- TOC entry 3694 (class 2604 OID 16435)
-- Name: squares id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.squares ALTER COLUMN id SET DEFAULT nextval('public.board_squares_id_seq'::regclass);


--
-- TOC entry 3699 (class 2604 OID 16436)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.players_id_seq'::regclass);


--
-- TOC entry 3702 (class 2606 OID 16438)
-- Name: boards board_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT board_pkey PRIMARY KEY (id);


--
-- TOC entry 3704 (class 2606 OID 16442)
-- Name: squares board_squares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.squares
    ADD CONSTRAINT board_squares_pkey PRIMARY KEY (id);


--
-- TOC entry 3708 (class 2606 OID 16446)
-- Name: players game_players_player_id_board_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT game_players_player_id_board_id_key UNIQUE (user_id, board_id);


--
-- TOC entry 3710 (class 2606 OID 16448)
-- Name: marker player_marks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marker
    ADD CONSTRAINT player_marks_pkey PRIMARY KEY (id);


--
-- TOC entry 3712 (class 2606 OID 16450)
-- Name: marker player_marks_player_id_square_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marker
    ADD CONSTRAINT player_marks_player_id_square_id_key UNIQUE (player_id, square_id);


--
-- TOC entry 3714 (class 2606 OID 16452)
-- Name: users players_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT players_email_key UNIQUE (email);


--
-- TOC entry 3716 (class 2606 OID 16454)
-- Name: users players_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);


--
-- TOC entry 3706 (class 2606 OID 16496)
-- Name: squares squares_board_id_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.squares
    ADD CONSTRAINT squares_board_id_index_key UNIQUE (board_id, index);


--
-- TOC entry 3719 (class 2606 OID 16455)
-- Name: squares board_squares_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.squares
    ADD CONSTRAINT board_squares_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id);


--
-- TOC entry 3723 (class 2606 OID 16497)
-- Name: marker fk_board_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marker
    ADD CONSTRAINT fk_board_id FOREIGN KEY (board_id) REFERENCES public.boards(id);


--
-- TOC entry 3717 (class 2606 OID 16490)
-- Name: boards fk_host_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT fk_host_id FOREIGN KEY (host_id) REFERENCES public.users(id);


--
-- TOC entry 3718 (class 2606 OID 16460)
-- Name: boards fk_winner; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT fk_winner FOREIGN KEY (winner_id) REFERENCES public.users(id);


--
-- TOC entry 3721 (class 2606 OID 16465)
-- Name: players game_players_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT game_players_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id);


--
-- TOC entry 3722 (class 2606 OID 16470)
-- Name: players game_players_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT game_players_player_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3724 (class 2606 OID 16475)
-- Name: marker player_marks_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marker
    ADD CONSTRAINT player_marks_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id);


--
-- TOC entry 3725 (class 2606 OID 16480)
-- Name: marker player_marks_square_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marker
    ADD CONSTRAINT player_marks_square_id_fkey FOREIGN KEY (square_id) REFERENCES public.squares(id);


--
-- TOC entry 3720 (class 2606 OID 16485)
-- Name: squares squares_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.squares
    ADD CONSTRAINT squares_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id);


-- Completed on 2026-07-24 22:28:13 PDT

--
-- PostgreSQL database dump complete
--

\unrestrict TZVahS9yO6a2v9TdMWWQMPNB9HRLkcmZ1cH2lYENK9GxhHy6nd7vujA5Foql7wI

