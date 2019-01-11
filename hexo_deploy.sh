#!/usr/bin/env sh
hexo clean
hexo g
cp ./CNAME ./public
hexo d
