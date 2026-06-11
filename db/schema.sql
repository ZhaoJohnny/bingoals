--
-- PostgreSQL database dump
--

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
-- Name: board; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.board (
    id integer NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    ended_at timestamp without time zone,
    winner_id integer
);


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


--
-- Name: board_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.board_id_seq OWNED BY public.board.id;


--
-- Name: squares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.squares (
    id integer CONSTRAINT board_squares_id_not_null NOT NULL,
    board_id integer CONSTRAINT board_squares_board_id_not_null NOT NULL,
    "row" integer CONSTRAINT board_squares_row_not_null NOT NULL,
    col integer CONSTRAINT board_squares_col_not_null NOT NULL,
    value character varying(10) CONSTRAINT board_squares_value_not_null NOT NULL
);



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


--
-- Name: players_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.players_id_seq OWNED BY public.users.id;


--
-- Name: board id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.board ALTER COLUMN id SET DEFAULT nextval('public.board_id_seq'::regclass);


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
-- Name: board board_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.board
    ADD CONSTRAINT board_pkey PRIMARY KEY (id);


--
-- Name: squares board_squares_board_id_row_col_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.squares
    ADD CONSTRAINT board_squares_board_id_row_col_key UNIQUE (board_id, "row", col);


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
    ADD CONSTRAINT board_squares_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.board(id);


--
-- Name: board fk_winner; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.board
    ADD CONSTRAINT fk_winner FOREIGN KEY (winner_id) REFERENCES public.users(id);


--
-- Name: players game_players_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT game_players_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.board(id);


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
-- PostgreSQL database dump complete
--



