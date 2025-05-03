
-- Add team_id column to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS team_id UUID;

-- Add a foreign key constraint to the teams table
ALTER TABLE public.projects
    ADD CONSTRAINT projects_team_id_fkey
    FOREIGN KEY (team_id)
    REFERENCES public.teams(id)
    ON DELETE CASCADE;

