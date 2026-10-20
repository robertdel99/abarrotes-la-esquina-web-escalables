#!/usr/bin/env bash
MONGO_HOME="${MONGO_HOME:-$HOME/mongodb}"
if [ ! -x "$MONGO_HOME/bin/mongod" ]; then
  echo "No encontré $MONGO_HOME/bin/mongod. Descarga MongoDB Community para macOS desde https://www.mongodb.com/try/download/community"
  echo "y descomprime la carpeta bin/ en $MONGO_HOME/bin"; exit 1
fi
mkdir -p "$MONGO_HOME/data"
if pgrep -x mongod >/dev/null; then echo "mongod ya está corriendo (pid $(pgrep -x mongod))"; exit 0; fi
"$MONGO_HOME/bin/mongod" --dbpath "$MONGO_HOME/data" --logpath "$MONGO_HOME/mongod.log" --bind_ip 127.0.0.1 --port 27017 --fork \
  && echo "MongoDB corriendo en mongodb://127.0.0.1:27017"
