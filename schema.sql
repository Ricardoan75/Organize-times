-- =============================================
-- ORGANIZE FUTEBOL GLOBAL - Schema Supabase
-- =============================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA: continentes
-- =============================================
CREATE TABLE IF NOT EXISTS continentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: paises
-- =============================================
CREATE TABLE IF NOT EXISTS paises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    continente_id UUID NOT NULL REFERENCES continentes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(nome, continente_id)
);

-- =============================================
-- TABELA: estados
-- =============================================
CREATE TABLE IF NOT EXISTS estados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    sigla VARCHAR(5),
    pais_id UUID NOT NULL REFERENCES paises(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(nome, pais_id)
);

-- =============================================
-- TABELA: municipios
-- =============================================
CREATE TABLE IF NOT EXISTS municipios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    estado_id UUID NOT NULL REFERENCES estados(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(nome, estado_id)
);

-- =============================================
-- TABELA: bairros
-- =============================================
CREATE TABLE IF NOT EXISTS bairros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    municipio_id UUID NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(nome, municipio_id)
);

-- =============================================
-- TABELA: users (perfis de usuário - além do auth.users do Supabase)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('administrador', 'tecnico')),
    plano VARCHAR(20) NOT NULL DEFAULT 'gratis' CHECK (plano IN ('gratis', 'basico', 'premium')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: times
-- =============================================
CREATE TABLE IF NOT EXISTS times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    tecnico VARCHAR(200),
    bairro_id UUID REFERENCES bairros(id) ON DELETE SET NULL,
    escudo_url TEXT,
    proprietario_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: campeonatos
-- =============================================
CREATE TABLE IF NOT EXISTS campeonatos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    nivel VARCHAR(20) NOT NULL CHECK (nivel IN ('bairro', 'municipio', 'estado', 'pais', 'continente')),
    -- Referências opcionais à localização do campeonato
    bairro_id UUID REFERENCES bairros(id) ON DELETE SET NULL,
    municipio_id UUID REFERENCES municipios(id) ON DELETE SET NULL,
    estado_id UUID REFERENCES estados(id) ON DELETE SET NULL,
    pais_id UUID REFERENCES paises(id) ON DELETE SET NULL,
    continente_id UUID REFERENCES continentes(id) ON DELETE SET NULL,
    data_inicio DATE,
    data_fim DATE,
    status VARCHAR(20) DEFAULT 'planejado' CHECK (status IN ('planejado', 'em_andamento', 'finalizado')),
    criado_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: campeonato_times (times inscritos em campeonatos)
-- =============================================
CREATE TABLE IF NOT EXISTS campeonato_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campeonato_id UUID NOT NULL REFERENCES campeonatos(id) ON DELETE CASCADE,
    time_id UUID NOT NULL REFERENCES times(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campeonato_id, time_id)
);

-- =============================================
-- TABELA: partidas
-- =============================================
CREATE TABLE IF NOT EXISTS partidas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campeonato_id UUID NOT NULL REFERENCES campeonatos(id) ON DELETE CASCADE,
    time_casa_id UUID NOT NULL REFERENCES times(id) ON DELETE CASCADE,
    time_fora_id UUID NOT NULL REFERENCES times(id) ON DELETE CASCADE,
    gols_casa INTEGER DEFAULT 0 CHECK (gols_casa >= 0),
    gols_fora INTEGER DEFAULT 0 CHECK (gols_fora >= 0),
    data_partida TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'agendada' CHECK (status IN ('agendada', 'em_andamento', 'finalizada', 'cancelada')),
    registrado_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (time_casa_id != time_fora_id)
);

-- =============================================
-- TABELA: classificacao
-- =============================================
CREATE TABLE IF NOT EXISTS classificacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campeonato_id UUID NOT NULL REFERENCES campeonatos(id) ON DELETE CASCADE,
    time_id UUID NOT NULL REFERENCES times(id) ON DELETE CASCADE,
    pontos INTEGER DEFAULT 0,
    jogos INTEGER DEFAULT 0,
    vitorias INTEGER DEFAULT 0,
    empates INTEGER DEFAULT 0,
    derrotas INTEGER DEFAULT 0,
    gols_pro INTEGER DEFAULT 0,
    gols_contra INTEGER DEFAULT 0,
    saldo_gols INTEGER GENERATED ALWAYS AS (gols_pro - gols_contra) STORED,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campeonato_id, time_id)
);

-- =============================================
-- FUNÇÃO: Atualizar classificação após partida
-- =============================================
CREATE OR REPLACE FUNCTION atualizar_classificacao()
RETURNS TRIGGER AS $$
DECLARE
    camp_id UUID;
    casa_id UUID;
    fora_id UUID;
    g_casa INTEGER;
    g_fora INTEGER;
BEGIN
    -- Só processa partidas finalizadas
    IF NEW.status != 'finalizada' THEN
        RETURN NEW;
    END IF;

    camp_id := NEW.campeonato_id;
    casa_id := NEW.time_casa_id;
    fora_id := NEW.time_fora_id;
    g_casa  := NEW.gols_casa;
    g_fora  := NEW.gols_fora;

    -- Garante que os registros de classificação existem
    INSERT INTO classificacao (campeonato_id, time_id)
    VALUES (camp_id, casa_id), (camp_id, fora_id)
    ON CONFLICT (campeonato_id, time_id) DO NOTHING;

    -- Se é uma atualização, reverte os dados anteriores primeiro
    IF TG_OP = 'UPDATE' AND OLD.status = 'finalizada' THEN
        -- Reverte time da casa (dados antigos)
        UPDATE classificacao SET
            jogos     = jogos - 1,
            vitorias  = vitorias  - CASE WHEN OLD.gols_casa > OLD.gols_fora THEN 1 ELSE 0 END,
            empates   = empates   - CASE WHEN OLD.gols_casa = OLD.gols_fora THEN 1 ELSE 0 END,
            derrotas  = derrotas  - CASE WHEN OLD.gols_casa < OLD.gols_fora THEN 1 ELSE 0 END,
            gols_pro  = gols_pro  - OLD.gols_casa,
            gols_contra = gols_contra - OLD.gols_fora,
            pontos    = pontos - CASE
                WHEN OLD.gols_casa > OLD.gols_fora THEN 3
                WHEN OLD.gols_casa = OLD.gols_fora THEN 1
                ELSE 0 END,
            updated_at = NOW()
        WHERE campeonato_id = camp_id AND time_id = OLD.time_casa_id;

        -- Reverte time de fora (dados antigos)
        UPDATE classificacao SET
            jogos     = jogos - 1,
            vitorias  = vitorias  - CASE WHEN OLD.gols_fora > OLD.gols_casa THEN 1 ELSE 0 END,
            empates   = empates   - CASE WHEN OLD.gols_fora = OLD.gols_casa THEN 1 ELSE 0 END,
            derrotas  = derrotas  - CASE WHEN OLD.gols_fora < OLD.gols_casa THEN 1 ELSE 0 END,
            gols_pro  = gols_pro  - OLD.gols_fora,
            gols_contra = gols_contra - OLD.gols_casa,
            pontos    = pontos - CASE
                WHEN OLD.gols_fora > OLD.gols_casa THEN 3
                WHEN OLD.gols_fora = OLD.gols_casa THEN 1
                ELSE 0 END,
            updated_at = NOW()
        WHERE campeonato_id = camp_id AND time_id = OLD.time_fora_id;
    END IF;

    -- Aplica novos dados - Time da Casa
    UPDATE classificacao SET
        jogos       = jogos + 1,
        vitorias    = vitorias  + CASE WHEN g_casa > g_fora THEN 1 ELSE 0 END,
        empates     = empates   + CASE WHEN g_casa = g_fora THEN 1 ELSE 0 END,
        derrotas    = derrotas  + CASE WHEN g_casa < g_fora THEN 1 ELSE 0 END,
        gols_pro    = gols_pro  + g_casa,
        gols_contra = gols_contra + g_fora,
        pontos      = pontos + CASE
            WHEN g_casa > g_fora THEN 3
            WHEN g_casa = g_fora THEN 1
            ELSE 0 END,
        updated_at  = NOW()
    WHERE campeonato_id = camp_id AND time_id = casa_id;

    -- Aplica novos dados - Time de Fora
    UPDATE classificacao SET
        jogos       = jogos + 1,
        vitorias    = vitorias  + CASE WHEN g_fora > g_casa THEN 1 ELSE 0 END,
        empates     = empates   + CASE WHEN g_fora = g_casa THEN 1 ELSE 0 END,
        derrotas    = derrotas  + CASE WHEN g_fora < g_casa THEN 1 ELSE 0 END,
        gols_pro    = gols_pro  + g_fora,
        gols_contra = gols_contra + g_casa,
        pontos      = pontos + CASE
            WHEN g_fora > g_casa THEN 3
            WHEN g_fora = g_casa THEN 1
            ELSE 0 END,
        updated_at  = NOW()
    WHERE campeonato_id = camp_id AND time_id = fora_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger na tabela partidas
DROP TRIGGER IF EXISTS trg_atualizar_classificacao ON partidas;
CREATE TRIGGER trg_atualizar_classificacao
    AFTER INSERT OR UPDATE ON partidas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_classificacao();

-- =============================================
-- VIEW: Ranking Global por nível
-- =============================================
CREATE OR REPLACE VIEW vw_ranking_global AS
SELECT
    c.id AS campeonato_id,
    c.nome AS campeonato,
    c.nivel,
    t.id AS time_id,
    t.nome AS time,
    t.escudo_url,
    cl.pontos,
    cl.jogos,
    cl.vitorias,
    cl.empates,
    cl.derrotas,
    cl.gols_pro,
    cl.gols_contra,
    cl.saldo_gols,
    -- Dados de localização
    b.id AS bairro_id, b.nome AS bairro,
    m.id AS municipio_id, m.nome AS municipio,
    e.id AS estado_id, e.nome AS estado,
    p.id AS pais_id, p.nome AS pais,
    cont.id AS continente_id, cont.nome AS continente,
    RANK() OVER (
        PARTITION BY c.id
        ORDER BY cl.pontos DESC, cl.saldo_gols DESC, cl.gols_pro DESC
    ) AS posicao
FROM classificacao cl
JOIN campeonatos c ON c.id = cl.campeonato_id
JOIN times t ON t.id = cl.time_id
LEFT JOIN bairros b ON b.id = t.bairro_id
LEFT JOIN municipios m ON m.id = b.municipio_id
LEFT JOIN estados e ON e.id = m.estado_id
LEFT JOIN paises p ON p.id = e.pais_id
LEFT JOIN continentes cont ON cont.id = p.continente_id;

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE times ENABLE ROW LEVEL SECURITY;
ALTER TABLE campeonatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE classificacao ENABLE ROW LEVEL SECURITY;

-- Políticas públicas de leitura
CREATE POLICY "Leitura pública - continentes" ON continentes FOR SELECT USING (true);
CREATE POLICY "Leitura pública - paises" ON paises FOR SELECT USING (true);
CREATE POLICY "Leitura pública - estados" ON estados FOR SELECT USING (true);
CREATE POLICY "Leitura pública - municipios" ON municipios FOR SELECT USING (true);
CREATE POLICY "Leitura pública - bairros" ON bairros FOR SELECT USING (true);
CREATE POLICY "Leitura pública - times" ON times FOR SELECT USING (true);
CREATE POLICY "Leitura pública - campeonatos" ON campeonatos FOR SELECT USING (true);
CREATE POLICY "Leitura pública - classificacao" ON classificacao FOR SELECT USING (true);
CREATE POLICY "Leitura pública - partidas" ON partidas FOR SELECT USING (true);

-- Políticas de escrita - apenas usuário autenticado pode criar time próprio
CREATE POLICY "Usuário vê seu próprio perfil" ON profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Técnico cria seu time" ON times
    FOR INSERT WITH CHECK (auth.uid() = proprietario_id);

CREATE POLICY "Técnico edita seu time" ON times
    FOR UPDATE USING (auth.uid() = proprietario_id);

-- =============================================
-- DADOS INICIAIS
-- =============================================
INSERT INTO continentes (nome) VALUES
    ('América do Sul'),
    ('América do Norte'),
    ('Europa'),
    ('África'),
    ('Ásia'),
    ('Oceania')
ON CONFLICT (nome) DO NOTHING;

-- Brasil
INSERT INTO paises (nome, continente_id)
SELECT 'Brasil', id FROM continentes WHERE nome = 'América do Sul'
ON CONFLICT DO NOTHING;

-- Estados brasileiros
INSERT INTO estados (nome, sigla, pais_id)
SELECT estados.nome, estados.sigla, p.id
FROM (VALUES
    ('São Paulo', 'SP'), ('Rio de Janeiro', 'RJ'), ('Minas Gerais', 'MG'),
    ('Bahia', 'BA'), ('Rio Grande do Sul', 'RS'), ('Paraná', 'PR'),
    ('Santa Catarina', 'SC'), ('Goiás', 'GO'), ('Pernambuco', 'PE'),
    ('Ceará', 'CE'), ('Pará', 'PA'), ('Maranhão', 'MA'),
    ('Amazonas', 'AM'), ('Mato Grosso', 'MT'), ('Espírito Santo', 'ES'),
    ('Rio Grande do Norte', 'RN'), ('Alagoas', 'AL'), ('Piauí', 'PI'),
    ('Paraíba', 'PB'), ('Mato Grosso do Sul', 'MS'), ('Sergipe', 'SE'),
    ('Rondônia', 'RO'), ('Tocantins', 'TO'), ('Acre', 'AC'),
    ('Amapá', 'AP'), ('Roraima', 'RR'), ('Distrito Federal', 'DF')
) AS estados(nome, sigla)
JOIN paises p ON p.nome = 'Brasil'
ON CONFLICT DO NOTHING;
