-- Fix mobile_num and postcode column sizes to handle longer values
ALTER TABLE whv_maker ALTER COLUMN mobile_num TYPE varchar(15);
ALTER TABLE whv_maker ALTER COLUMN postcode TYPE varchar(10);

-- Also fix employer table for consistency
ALTER TABLE employer ALTER COLUMN mobile_num TYPE varchar(15);
ALTER TABLE employer ALTER COLUMN postcode TYPE varchar(10);