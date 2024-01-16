-- Switch to the root container
ALTER SESSION SET CONTAINER = CDB$ROOT;

-- Create the chatterhub PDB
CREATE PLUGGABLE DATABASE chatterhub
ADMIN USER chatterhub IDENTIFIED BY olDXgfmHPkOyRiqZEJKjKLPTDX0S20
DEFAULT TABLESPACE users
DATAFILE '/opt/oracle/oradata/XE/chatterhub/plug_chatterhub_1.dbf' SIZE 200M AUTOEXTEND ON
FILE_NAME_CONVERT=('/opt/oracle/oradata/XE/', '/opt/oracle/oradata/XE/chatterhub/');

-- Open the chatterhub PDB
ALTER PLUGGABLE DATABASE chatterhub OPEN;

-- Switch to the chatterhub PDB
ALTER SESSION SET CONTAINER = chatterhub;

-- Grant unlimited tablespace to the chatterhub user
GRANT UNLIMITED TABLESPACE TO chatterhub;

-- Create the sequence for message_id in the chatterhub user schema
CREATE SEQUENCE chatterhub.MESSAGE_ID_SEQ;

-- Create the "messages" table in the chatterhub user schema using the sequence
CREATE TABLE chatterhub.messages (
    MESSAGE_ID NUMBER DEFAULT chatterhub.MESSAGE_ID_SEQ.NEXTVAL PRIMARY KEY,
    USER_ID VARCHAR2(100) NOT NULL,
    MESSAGE VARCHAR2(4000) NOT NULL,
    DISPLAY_NAME VARCHAR2(100) NOT NULL,
    PHOTO_URL VARCHAR2(255) NOT NULL,
    SHOW_AVATAR NUMBER(1, 0) NOT NULL,
    SHOW_TIMESTAMP NUMBER(1, 0) NOT NULL,
    CREATED_AT NUMBER(38, 0) NOT NULL
);
