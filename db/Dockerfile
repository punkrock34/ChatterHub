# Use the Oracle XE image as the base image
FROM gvenzl/oracle-xe:latest

# Copy the initialization script to the container
COPY initDB.sql /docker-entrypoint-initdb.d/

# Copy the health check script
COPY checkDBStatus.sh /opt/oracle/checkDBStatus.sh

# Set execute permissions for the health check script and change user to oracle
USER root
RUN chmod +x /opt/oracle/checkDBStatus.sh
USER oracle  

# Set environment variables
ENV ORACLE_PDB=chatterhub \
    ORACLE_PWD=olDXgfmHPkOyRiqZEJKjKLPTDX0S20 \
    ORACLE_CHARACTERSET=AL32UTF8

# Health check
HEALTHCHECK --interval=1m CMD [ "/opt/oracle/checkDBStatus.sh" ]

# Expose necessary ports
EXPOSE 1521