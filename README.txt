npx web-ext run --firefox-profile=~/snap/firefox/common/.mozilla/firefox/b4mnfb6c.dev

# locate profile (snap firefox installation)
ls -la ~/snap/firefox/common/.mozilla/firefox/

chmod -R 755 ~/snap/firefox/common/.mozilla/firefox/b4mnfb6c.dev


npx web-ext run --firefox-profile=$(mktemp -d)