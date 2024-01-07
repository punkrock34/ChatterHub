-- Switch to the root container
ALTER SESSION SET CONTAINER = CDB$ROOT;

-- Create the chatterhub PDB
CREATE PLUGGABLE DATABASE chatterhub
ADMIN USER admin_user IDENTIFIED BY olDXgfmHPkOyRiqZEJKjKLPTDX0S20
DEFAULT TABLESPACE users
DATAFILE '/opt/oracle/oradata/XE/chatterhub/plug_chatterhub_1.dbf' SIZE 200M AUTOEXTEND ON
FILE_NAME_CONVERT=('/opt/oracle/oradata/XE/', '/opt/oracle/oradata/XE/chatterhub/');

-- Open the chatterhub PDB
ALTER PLUGGABLE DATABASE chatterhub OPEN;

-- Switch to the chatterhub PDB
ALTER SESSION SET CONTAINER = chatterhub;

-- Create the "messages" table
CREATE TABLE messages (
    USER_ID NUMBER(12, 0) NOT NULL PRIMARY KEY,
    MESSAGE VARCHAR2(4000) NOT NULL,
    DISPLAY_NAME VARCHAR2(100) NOT NULL,
    PHOTO_URL VARCHAR2(255) NOT NULL,
    SHOW_AVATAR NUMBER(1, 0) NOT NULL,
    SHOW_TIMESTAMP NUMBER(1, 0) NOT NULL,
    CREATED_AT TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Additional initialization steps can be added here

-- Script execution completed successfully.