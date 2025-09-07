-- Drop existing maker_visa table and recreate with simplified structure
DROP TABLE IF EXISTS maker_visa;

-- Create simplified maker_visa table
CREATE TABLE maker_visa (
  user_id uuid PRIMARY KEY,
  country_id integer NOT NULL,
  stage_id integer NOT NULL,
  dob date NOT NULL,
  expiry_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  FOREIGN KEY (country_id) REFERENCES country(country_id),
  FOREIGN KEY (stage_id) REFERENCES visa_stage(stage_id)
);

-- Enable RLS
ALTER TABLE maker_visa ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own visa" 
ON maker_visa 
FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_maker_visa_updated_at
  BEFORE UPDATE ON maker_visa
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();