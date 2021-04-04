#! /bin/sh

DENO_DIR=./.denoCache deno test --unstable --allow-net=0.0.0.0:8000,deno.land,localhost:5432,localhost:6379,localhost:8000
