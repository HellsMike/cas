from sqlalchemy import Column, Integer, String, Float
from geoalchemy2 import Geometry
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Airport(Base):
    __tablename__ = 'airports'
    
    id = Column(Integer, primary_key=True)
    ident = Column(String)
    type = Column(String)
    name = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    elevation_ft = Column(Integer)
    continent = Column(String)
    iso_country = Column(String)
    iso_region = Column(String)
    municipality = Column(String)
    scheduled_service = Column(String)
    gps_code = Column(String)
    iata_code = Column(String)
    local_code = Column(String)
    home_link = Column(String)
    wikipedia = Column(String)
    keywords = Column(String)
    geog = Column(Geometry('POINT'))
