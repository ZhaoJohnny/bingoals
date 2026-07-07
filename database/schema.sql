--
-- PostgreSQL database dump
--

\restrict LuYkliuKLjzPFdIr0rZJUAufa4vD5M84jH6ITGMplGZeTU4Jyeu36RPKdJ9vdDm

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: boards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.boards (
    id integer CONSTRAINT board_id_not_null NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    ended_at timestamp without time zone,
    winner_id integer,
    host_id integer NOT NULL
);


ALTER TABLE public.boards OWNER TO postgres;

--
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
-- Name: board_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.board_id_seq OWNED BY public.boards.id;


--
-- Name: squares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.squares (
    id integer CONSTRAINT board_squares_id_not_null NOT NULL,
    board_id integer CONSTRAINT board_squares_board_id_not_null NOT NULL,
    goal character varying(255),
    index integer CONSTRAINT board_squares_index_not_null NOT NULL,
    player_id integer
);


ALTER TABLE public.squares OWNER TO postgres;

--
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
-- Name: board_squares_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.board_squares_id_seq OWNED BY public.squares.id;


--
-- Name: players; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.players (
    id integer CONSTRAINT game_players_id_not_null NOT NULL,
    player_id integer CONSTRAINT game_players_player_id_not_null NOT NULL,
    board_id integer CONSTRAINT game_players_board_id_not_null NOT NULL,
    joined_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.players OWNER TO postgres;

--
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
-- Name: game_players_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.game_players_id_seq OWNED BY public.players.id;


--
-- Name: marker; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marker (
    id integer CONSTRAINT player_marks_id_not_null NOT NULL,
    player_id integer CONSTRAINT player_marks_player_id_not_null NOT NULL,
    square_id integer CONSTRAINT player_marks_square_id_not_null NOT NULL,
    marked_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.marker OWNER TO postgres;

--
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
-- Name: player_marks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.player_marks_id_seq OWNED BY public.marker.id;


--
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
-- Name: players_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.players_id_seq OWNED BY public.users.id;


--
-- Name: boards id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boards ALTER COLUMN id SET DEFAULT nextval('public.board_id_seq'::regclass);


--
-- Name: marker id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marker ALTER COLUMN id SET DEFAULT nextval('public.player_marks_id_seq'::regclass);


--
-- Name: players id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players ALTER COLUMN id SET DEFAULT nextval('public.game_players_id_seq'::regclass);


--
-- Name: squares id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.squares ALTER COLUMN id SET DEFAULT nextval('public.board_squares_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.players_id_seq'::regclass);


--
-- Name: boards board_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT board_pkey PRIMARY KEY (id);


--
-- Name: squares board_squares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.squares
    ADD CONSTRAINT board_squares_pkey PRIMARY KEY (id);


--
-- Name: players game_players_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT game_players_pkey PRIMARY KEY (id);


--
-- Name: players game_players_player_id_board_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT game_players_player_id_board_id_key UNIQUE (player_id, board_id);


--
-- Name: marker player_marks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marker
    ADD CONSTRAINT player_marks_pkey PRIMARY KEY (id);


--
-- Name: marker player_marks_player_id_square_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marker
    ADD CONSTRAINT player_marks_player_id_square_id_key UNIQUE (player_id, square_id);


--
-- Name: users players_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT players_email_key UNIQUE (email);


--
-- Name: users players_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);


--
-- Name: squares board_squares_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.squares
    ADD CONSTRAINT board_squares_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id);


--
-- Name: boards boards_host_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.users(id);


--
-- Name: boards boards_winner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.users(id);


--
-- Name: boards fk_winner; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT fk_winner FOREIGN KEY (winner_id) REFERENCES public.users(id);


--
-- Name: players game_players_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT game_players_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id);


--
-- Name: players game_players_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT game_players_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id);


--
-- Name: marker player_marks_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marker
    ADD CONSTRAINT player_marks_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id);


--
-- Name: marker player_marks_square_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marker
    ADD CONSTRAINT player_marks_square_id_fkey FOREIGN KEY (square_id) REFERENCES public.squares(id);


--
-- Name: squares squares_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.squares
    ADD CONSTRAINT squares_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict LuYkliuKLjzPFdIr0rZJUAufa4vD5M84jH6ITGMplGZeTU4Jyeu36RPKdJ9vdDm

