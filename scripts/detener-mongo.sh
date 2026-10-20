#!/usr/bin/env bash
if pgrep -x mongod >/dev/null; then pkill -x mongod && echo "MongoDB detenido"; else echo "mongod no estaba corriendo"; fi
