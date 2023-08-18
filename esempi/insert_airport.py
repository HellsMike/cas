from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# PostgreSQL connection parameters
dbname = "Airports"  # Your database name
user = "postgres"  # Your database username
password = "akira"  # Your database password
host = "localhost"
port = "5432"
schema = "data"  # Schema name where the 'airports' table is located

# Create an SQLAlchemy engine
engine = create_engine(f"postgresql://{user}:{password}@{host}:{port}/{dbname}")

# Establish a connection
conn = engine.connect()

# Check if the airport already exists in the database
existing_query = text(f"SELECT * FROM {schema}.airports WHERE ident = :ident")
existing_result = conn.execute(existing_query, ident="NEW").fetchone()

# New airport data
new_entry = {
    "id": 1,
    "ident": "NEW",
    "type": "small_airport",
    "name": "Aeroporto dei Druidi",
    "lat": 48.12345,
    "lon": 4.56789,
    "elevation_ft": 0,
    "continent": "NA",
    "iso_country": "US",
    "iso_region": "US-IN",
    "municipality": "Unknown",
    "scheduled_service": False,
    "gps_code": "NEW",
    "iata_code": None,
    "local_code": "NEW",
    "home_link": None,
    "wikipedia": None,
    "keywords": None,
    "geog": "POINT(4.56789 48.12345)"
}

if existing_result:
    # If airport exists, update all its data
    update_query = text(
        f"UPDATE {schema}.airports "
        f"SET id = :id, type = :type, name = :name, lat = :lat, lon = :lon, "
        f"elevation_ft = :elevation_ft, continent = :continent, iso_country = :iso_country, "
        f"iso_region = :iso_region, municipality = :municipality, "
        f"scheduled_service = :scheduled_service, gps_code = :gps_code, "
        f"iata_code = :iata_code, local_code = :local_code, home_link = :home_link, "
        f"wikipedia = :wikipedia, keywords = :keywords, geog = ST_GeographyFromText(:geog) "
        f"WHERE ident = :ident"
    )
    conn.execute(update_query, **new_entry)
    print("Airport updated")
else:
    # If airport does not exist, insert new data
    insert_query = text(
        f"INSERT INTO {schema}.airports (id, ident, type, name, lat, lon, elevation_ft, continent, iso_country, iso_region, municipality, scheduled_service, gps_code, iata_code, local_code, home_link, wikipedia, keywords, geog) "
        f"VALUES (:id, :ident, :type, :name, :lat, :lon, :elevation_ft, :continent, :iso_country, :iso_region, :municipality, :scheduled_service, :gps_code, :iata_code, :local_code, :home_link, :wikipedia, :keywords, ST_GeographyFromText(:geog))"
    )
    conn.execute(insert_query, **new_entry)
    print("Airport inserted")

# Close the connection
conn.close()
