#!/bin/bash
# Check the status of the Oracle pluggable database
status=$(sqlplus -S sys/olDXgfmHPkOyRiqZEJKjKLPTDX0S20@//localhost:1521/chatterhub as sysdba <<EOF
    set heading off;
    select status from v\$pdb where name = 'CHATTERHUB';
    exit;
EOF
)

# Check if the status is OPEN
if [ "$status" == "OPEN" ]; then
    exit 0  # Database is healthy
else
    # Log the attempt to reopen the database
    echo "Attempting to reopen CHATTERHUB database."

    # Open the database only if it's not already open
    sqlplus -S sys/olDXgfmHPkOyRiqZEJKjKLPTDX0S20@//localhost:1521/chatterhub as sysdba <<EOF
    WHENEVER SQLERROR EXIT SQL.SQLCODE
    alter pluggable database CHATTERHUB open;
    exit;
EOF

    # Check the exit status to determine success or failure
    if [ $? -eq 0 ]; then
        echo "CHATTERHUB database reopened successfully."
        exit 0  # Database is healthy now
    elif [ $? -eq 1 ]; then
        echo "CHATTERHUB database is already open."
        exit 0  # Database is healthy
    else
        echo "Failed to reopen CHATTERHUB database."
        exit 1  # Database is still not healthy
    fi
fi
