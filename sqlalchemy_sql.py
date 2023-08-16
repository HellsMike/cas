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

# Prepare and execute a spatial SQL query
query = text(
    f"SELECT * FROM {schema}.airports WHERE ST_DWithin(geog, ST_Point(:lon, :lat), :distance)"
)
params = {"lat": 48.7761001586914, "lon": 4.18449020385742, "distance": 0.1}
result = conn.execute(query, params).fetchone()

# Close the connection
conn.close()

# Print the result
print(result)
