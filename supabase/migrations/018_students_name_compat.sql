-- Migration 018: reconcile fullname vs first_name/last_name on students
-- The app inserts a single 'fullname'; the table has legacy first_name/last_name
-- with NOT NULL on first_name → "null value in column first_name violates
-- not-null constraint". Make them nullable + auto-derive from fullname.

ALTER TABLE public.students ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE public.students ALTER COLUMN last_name  DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.students_split_name()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.fullname IS NOT NULL THEN
    NEW.first_name := COALESCE(NEW.first_name, split_part(NEW.fullname, ' ', 1));
    NEW.last_name  := COALESCE(NEW.last_name,
                       NULLIF(trim(substr(NEW.fullname, length(split_part(NEW.fullname,' ',1)) + 1)), ''));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_students_split_name ON public.students;
CREATE TRIGGER trg_students_split_name
BEFORE INSERT OR UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.students_split_name();

NOTIFY pgrst, 'reload schema';

SELECT 'Migration 018 complete — student name compatibility' AS result;
