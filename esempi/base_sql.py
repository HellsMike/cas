from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from airports import Airport  # Import the Airport class from airports.py

# PostgreSQL connection parameters
dbname = "Airports"  # Your database name
user = "postgres"  # Your database username
password = "akira"  # Your database password
host = "localhost"
port = "5432"
schema = "data"  # Schema name where the 'airports' table is located

# Create an SQLAlchemy engine
engine = create_engine(f"postgresql://{user}:{password}@{host}:{port}/{dbname}")

# Create a session using SQLAlchemy
Session = sessionmaker(bind=engine)
session = Session()

# ... your connection details ...

# Establish a connection
conn = engine.connect()

# Execute a simple SQL query
query = "SELECT * FROM data.airports WHERE id = 4176"
result = conn.execute(query).fetchone()

# Close the connection
conn.close()

# Print the result
print(result)


