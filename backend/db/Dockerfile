# Use the Oracle XE image as the base image
FROM gvenzl/oracle-xe:latest

# Copy the initialization script to the container
COPY initDB.sql /docker-entrypoint-initdb.d/

# Set environment variables
ENV ORACLE_PDB=chatterhub \
    ORACLE_PWD=olDXgfmHPkOyRiqZEJKjKLPTDX0S20 \
    ORACLE_CHARACTERSET=AL32UTF8

# Expose necessary ports
EXPOSE 1521
