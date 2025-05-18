#!/bin/bash

# Loop through all HTML files in the blog directory
for file in blog/*.html; do
    # Create a temporary file
    temp_file="${file}.tmp"
    
    # Add Font Awesome CSS link at the top and replace navigation
    awk '
    BEGIN { font_awesome_added = 0 }
    /<head>/ {
        print $0
        if (!font_awesome_added) {
            print "    <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css\">"
            font_awesome_added = 1
        }
        next
    }
    /<link rel="stylesheet" href="https:\/\/cdnjs.cloudflare.com\/ajax\/libs\/font-awesome\/4.7.0\/css\/font-awesome.min.css">/ {
        next
    }
    /<nav class="nav">/,/<\/nav>/ {
        if ($0 ~ /<nav class="nav">/) {
            print "<div class=\"topnav\" id=\"myTopnav\">"
            print "                    <a href=\"/\" class=\"active\">Home</a>"
            print "                    <a href=\"/blog.html\">Blog</a>"
            print "                    <a href=\"/art.html\">Art</a>"
            print "                    <a href=\"/about.html\">About</a>"
            print "                    <a href=\"javascript:void(0);\" class=\"icon\" onclick=\"hamburger()\">"
            print "                      <i class=\"fa fa-bars\"></i>"
            print "                    </a>"
            print "                  </div>"
            next
        }
        next
    }
    { print }
    ' "$file" > "$temp_file"
    
    # Replace the original file with the temporary file
    mv "$temp_file" "$file"
done 