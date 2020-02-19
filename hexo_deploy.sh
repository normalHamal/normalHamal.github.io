#!/usr/bin/env sh
hexo clean
hexo g
hexo d
ossutil cp -r public/ oss://oss-normalhaml/blog -u