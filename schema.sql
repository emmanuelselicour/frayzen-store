-- ==============================================================================
-- FRAYZEN SHOP - SCHEMA SQL POUR SUPABASE (SUPABASE SQL EDITOR)
-- Plateforme N°1 Recharge Diamants Free Fire en Haïti (NATCASH & MonCash)
-- ==============================================================================
-- Ce fichier contient l'intégralité de la structure de base de données,
-- les contraintes d'unicité strictes, les fonctions PL/pgSQL, les triggers
-- automatiques d'inscription et de mise à jour, ainsi que les stratégies RLS.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. EXTENSIONS POSTGRESQL
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. CRÉATION DES TABLES
-- ------------------------------------------------------------------------------

-- 1.1 TABLE: PROFILES (Profils des utilisateurs liés à auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT,
    wallet_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (wallet_balance >= 0),
    is_email_verified BOOLEAN NOT NULL DEFAULT true,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 TABLE: PRODUCTS (Packs de diamants Free Fire et produits)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_code VARCHAR(50) UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    diamonds_amount INTEGER NOT NULL DEFAULT 0,
    bonus_diamonds INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    category TEXT NOT NULL DEFAULT 'free_fire',
    stock INTEGER NOT NULL DEFAULT 100 CHECK (stock >= 0),
    pin_codes TEXT[] DEFAULT '{}',
    is_popular BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 TABLE: WALLET_DEPOSITS (Demandes de dépôts NATCASH / MonCash)
-- INCLUT CONTRAINTE UNIQUE STRICTE UNIQUE(transaction_id)
CREATE TABLE IF NOT EXISTS public.wallet_deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id VARCHAR(50) NOT NULL UNIQUE, -- Bloque absolument la réutilisation d'un même code à 14 chiffres
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'natcash' CHECK (payment_method IN ('natcash', 'moncash')),
    status VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'approuve', 'rejete')),
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.4 TABLE: ORDERS (Commandes effectuées)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    game_player_id TEXT NOT NULL,
    pin_code TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(30) NOT NULL DEFAULT 'wallet',
    status VARCHAR(20) NOT NULL DEFAULT 'livre' CHECK (status IN ('en_attente', 'livre', 'annule')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 TABLE: CONTACTS (Tickets de support / Messages de contact)
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'en_cours', 'resolu')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.6 TABLE: APP_SETTINGS (Configuration des numéros NATCASH / MonCash)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    natcash_number TEXT NOT NULL DEFAULT '41355116',
    natcash_name TEXT NOT NULL DEFAULT 'HENRY',
    moncash_number TEXT DEFAULT '47124969',
    moncash_name TEXT DEFAULT 'JOSELYNE TITY',
    contact_email TEXT NOT NULL DEFAULT 'contact@frayzenshop.com',
    contact_phone TEXT NOT NULL DEFAULT '+509 4135 5116',
    instructions TEXT DEFAULT 'Envoyez le montant exact sur NATCASH ou MonCash ci-dessus. Copiez ensuite votre code de transaction à 14 chiffres ou téléversez la capture.',
    admin_pin VARCHAR(10) DEFAULT '123456',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assurer que la colonne admin_pin existe si la table existait déjà
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS admin_pin VARCHAR(10) DEFAULT '123456';


-- ------------------------------------------------------------------------------
-- 2. INDEX DE PERFORMANCE & UNICITÉ
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_wallet_deposits_user_id ON public.wallet_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_deposits_transaction_id ON public.wallet_deposits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);


-- ------------------------------------------------------------------------------
-- 3. TRIGGERS ET FONCTIONS AUTOMATIQUES
-- ------------------------------------------------------------------------------

-- 3.1 Mettre à jour automatiquement le champ `updated_at` lors de toute modification
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_wallet_deposits_updated_at ON public.wallet_deposits;
CREATE TRIGGER trigger_wallet_deposits_updated_at
    BEFORE UPDATE ON public.wallet_deposits
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER trigger_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3.2 Trigger Automatique lors d'une nouvelle inscription dans `auth.users`
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone_number,
        wallet_balance,
        is_email_verified,
        is_admin
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        0.00,
        true,
        (LOWER(NEW.email) IN ('emmanuelselicour.2002@gmail.com', 'emmanuel@gmail.com', 'danyff455@gmail.com'))
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();


-- ------------------------------------------------------------------------------
-- 4. FONCTIONS RPC (PROCÉDURES STOCKÉES D'ADMINISTRATION ET DE TRANSACTION)
-- ------------------------------------------------------------------------------

-- 4.1 Fonction RPC pour approuver un dépôt et créditer automatiquement le portefeuille
CREATE OR REPLACE FUNCTION public.approve_deposit(deposit_id UUID)
RETURNS JSON AS $$
DECLARE
    v_deposit public.wallet_deposits%ROWTYPE;
    v_new_balance NUMERIC(12, 2);
BEGIN
    -- Récupérer le dépôt en cours
    SELECT * INTO v_deposit
    FROM public.wallet_deposits
    WHERE id = deposit_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Dépôt introuvable (ID: %)', deposit_id;
    END IF;

    IF v_deposit.status = 'approuve' THEN
        RAISE EXCEPTION 'Ce dépôt a déjà été approuvé.';
    END IF;

    -- Passer le dépôt en 'approuve'
    UPDATE public.wallet_deposits
    SET status = 'approuve',
        updated_at = NOW()
    WHERE id = deposit_id;

    -- Créditer automatiquement le profil de l'utilisateur
    UPDATE public.profiles
    SET wallet_balance = wallet_balance + v_deposit.amount,
        updated_at = NOW()
    WHERE id = v_deposit.user_id
    RETURNING wallet_balance INTO v_new_balance;

    RETURN json_build_object(
        'success', true,
        'message', 'Dépôt approuvé avec succès et solde crédité.',
        'deposit_id', deposit_id,
        'user_id', v_deposit.user_id,
        'amount_credited', v_deposit.amount,
        'new_wallet_balance', v_new_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2 Fonction RPC pour ajuster ou débiter manuellement le solde d'un client
CREATE OR REPLACE FUNCTION public.adjust_wallet_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS JSON AS $$
DECLARE
    v_current_balance NUMERIC(12, 2);
    v_new_balance NUMERIC(12, 2);
BEGIN
    SELECT wallet_balance INTO v_current_balance
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Utilisateur introuvable.';
    END IF;

    IF (v_current_balance + p_amount) < 0 THEN
        RAISE EXCEPTION 'Opération refusée: Solde insuffisant (% HTG).', v_current_balance;
    END IF;

    UPDATE public.profiles
    SET wallet_balance = wallet_balance + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id
    RETURNING wallet_balance INTO v_new_balance;

    RETURN json_build_object(
        'success', true,
        'user_id', p_user_id,
        'previous_balance', v_current_balance,
        'adjustment', p_amount,
        'new_balance', v_new_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ------------------------------------------------------------------------------
-- 5. SÉCURITÉ RLS (ROW LEVEL SECURITY)
-- ------------------------------------------------------------------------------

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Helper Function pour vérifier si un utilisateur est Administrateur
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.1 STRATÉGIES RLS : PROFILES
DROP POLICY IF EXISTS "Lecture de son propre profil" ON public.profiles;
CREATE POLICY "Lecture de son propre profil"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Mise à jour de son propre profil" ON public.profiles;
CREATE POLICY "Mise à jour de son propre profil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admin a tous les accès sur profiles" ON public.profiles;
CREATE POLICY "Admin a tous les accès sur profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- 5.2 STRATÉGIES RLS : PRODUCTS
DROP POLICY IF EXISTS "Lecture publique des produits" ON public.products;
CREATE POLICY "Lecture publique des produits"
    ON public.products FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Admin modifie les produits" ON public.products;
CREATE POLICY "Admin modifie les produits"
    ON public.products FOR ALL
    USING (public.is_admin());

-- 5.3 STRATÉGIES RLS : WALLET_DEPOSITS
DROP POLICY IF EXISTS "Lecture de ses propres dépôts" ON public.wallet_deposits;
CREATE POLICY "Lecture de ses propres dépôts"
    ON public.wallet_deposits FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Création de ses propres dépôts" ON public.wallet_deposits;
CREATE POLICY "Création de ses propres dépôts"
    ON public.wallet_deposits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin gère tous les dépôts" ON public.wallet_deposits;
CREATE POLICY "Admin gère tous les dépôts"
    ON public.wallet_deposits FOR ALL
    USING (public.is_admin());

-- 5.4 STRATÉGIES RLS : ORDERS
DROP POLICY IF EXISTS "Lecture de ses propres commandes" ON public.orders;
CREATE POLICY "Lecture de ses propres commandes"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Création de ses propres commandes" ON public.orders;
CREATE POLICY "Création de ses propres commandes"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin gère toutes les commandes" ON public.orders;
CREATE POLICY "Admin gère toutes les commandes"
    ON public.orders FOR ALL
    USING (public.is_admin());

-- 5.5 STRATÉGIES RLS : CONTACTS
DROP POLICY IF EXISTS "Lecture de ses propres tickets" ON public.contacts;
CREATE POLICY "Lecture de ses propres tickets"
    ON public.contacts FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Création de tickets par quiconque" ON public.contacts;
CREATE POLICY "Création de tickets par quiconque"
    ON public.contacts FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admin gère tous les tickets" ON public.contacts;
CREATE POLICY "Admin gère tous les tickets"
    ON public.contacts FOR ALL
    USING (public.is_admin());

-- 5.6 STRATÉGIES RLS : APP_SETTINGS
DROP POLICY IF EXISTS "Lecture publique de la config" ON public.app_settings;
CREATE POLICY "Lecture publique de la config"
    ON public.app_settings FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Admin modifie la config" ON public.app_settings;
CREATE POLICY "Admin modifie la config"
    ON public.app_settings FOR ALL
    USING (public.is_admin());


-- ------------------------------------------------------------------------------
-- 6. DONNÉES INITIALES (SEED DATA)
-- ------------------------------------------------------------------------------

-- 6.1 Configuration Initiale NATCASH / MonCash
INSERT INTO public.app_settings (
    natcash_number,
    natcash_name,
    moncash_number,
    moncash_name,
    contact_email,
    contact_phone,
    instructions,
    admin_pin
)
VALUES (
    '41355116',
    'HENRY',
    '47124969',
    'JOSELYNE TITY',
    'contact@frayzenshop.com',
    '+509 4135 5116',
    'Envoyez le montant exact sur NATCASH ou MonCash ci-dessus. Copiez ensuite votre code de transaction à 14 chiffres ou téléversez la capture d''écran.',
    '123456'
)
ON CONFLICT DO NOTHING;

-- 6.2 Insertion des packs de diamants Free Fire par défaut
INSERT INTO public.products (product_code, title, description, price, diamonds_amount, bonus_diamonds, image_url, category, stock, is_popular)
VALUES
    ('ff-100', '💎 100 + Bonus 10', 'Top Up par ID Free Fire - Livré à l''instant', 145.00, 100, 10, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80', 'free_fire', 100, false),
    ('ff-200', '💎 200 + Bonus 20', 'Top Up par ID Free Fire - Livré à l''instant', 390.00, 200, 20, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80', 'free_fire', 100, false),
    ('ff-300', '💎 300 + Bonus 41', 'Top Up par ID Free Fire - Livré à l''instant', 470.00, 300, 41, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80', 'free_fire', 100, true),
    ('ff-400', '💎 400', 'Top Up par ID Free Fire - Livré à l''instant', 615.00, 400, 0, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80', 'free_fire', 100, false),
    ('ff-500', '💎 500 + Bonus 72', 'Top Up par ID Free Fire - Livré à l''instant', 745.00, 500, 72, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80', 'free_fire', 100, true),
    ('ff-1000', '💎 1000 + Bonus 166', 'Top Up par ID Free Fire - Livré à l''instant', 1495.00, 1000, 166, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80', 'free_fire', 100, false),
    ('ff-2000', '💎 2000 + Bonus 398', 'Top Up par ID Free Fire - Livré à l''instant', 2895.00, 2000, 398, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80', 'free_fire', 100, false),
    ('ff-5000', '💎 5000 + Bonus 1160', 'Top Up par ID Free Fire - Livré à l''instant', 7495.00, 5000, 1160, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80', 'free_fire', 100, true)
ON CONFLICT (product_code) DO NOTHING;

-- ==============================================================================
-- FIN DU SCRIPT SCHEMA.SQL DE FRAYZEN SHOP
-- Copiez et collez tout ce contenu dans le SQL Editor de Supabase et cliquez sur RUN.
-- ==============================================================================
