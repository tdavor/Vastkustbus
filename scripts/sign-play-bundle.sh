#!/usr/bin/env bash
set -euo pipefail
bundle=android/app/build/outputs/bundle/release/app-release.aab
version="$(node -p "require('./app.json').expo.version")"
output="MinneTrail-v${version}.aab"
java_tool="$RUNNER_TEMP/bundletool.jar"
curl --fail --silent --show-error --location --retry 3 https://github.com/google/bundletool/releases/download/1.18.3/bundletool-all-1.18.3.jar -o "$java_tool"
echo "a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29  $java_tool" | sha256sum --check
java -jar "$java_tool" validate --bundle="$bundle"
java -jar "$java_tool" dump manifest --bundle="$bundle" > "$RUNNER_TEMP/play-manifest.xml"
python - <<'PY'
import json,os,xml.etree.ElementTree as ET
from pathlib import Path
manifest=ET.parse(Path(os.environ['RUNNER_TEMP'])/'play-manifest.xml').getroot()
android='{http://schemas.android.com/apk/res/android}'
config=json.loads(Path('app.json').read_text())['expo']
assert manifest.attrib['package']=='se.minnetrail.app'
assert manifest.attrib[android+'versionCode']==str(config['android']['versionCode'])
assert manifest.attrib[android+'versionName']==config['version']
assert manifest.find('application').attrib.get(android+'debuggable','false')=='false'
permissions={p.attrib.get(android+'name') for p in manifest.findall('uses-permission')}
for forbidden in ['ACCESS_FINE_LOCATION','ACCESS_COARSE_LOCATION','ACCESS_BACKGROUND_LOCATION','REQUEST_INSTALL_PACKAGES','AD_ID']:
    assert not any(p and p.endswith('.'+forbidden) for p in permissions), permissions
print('Verified Play package, release version and absence of location, APK-install and advertising-ID permissions.')
PY
unzip -p "$bundle" base/assets/models/informative-style1.onnx > "$RUNNER_TEMP/bundled-model.onnx"
cmp "$RUNNER_TEMP/bundled-model.onnx" modules/informative-drawings/android/src/main/assets/models/informative-style1.onnx
umask 077
signing_dir="$(mktemp -d)"
trap 'rm -rf "$signing_dir"' EXIT
export MINNETRAIL_SIGN_PASS="$(openssl rand -hex 32)"
echo "::add-mask::$MINNETRAIL_SIGN_PASS"
printf '%s' "$SIGNING_KEY_BASE64" | base64 --decode > "$signing_dir/key.pk8"
printf '%s' "$SIGNING_CERT_BASE64" | base64 --decode > "$signing_dir/cert.der"
openssl pkcs8 -inform DER -in "$signing_dir/key.pk8" -nocrypt -out "$signing_dir/key.pem"
openssl x509 -inform DER -in "$signing_dir/cert.der" -out "$signing_dir/cert.pem"
openssl pkcs12 -export -inkey "$signing_dir/key.pem" -in "$signing_dir/cert.pem" -name minnetrail-upload -out "$signing_dir/upload.p12" -passout env:MINNETRAIL_SIGN_PASS
jarsigner -keystore "$signing_dir/upload.p12" -storetype PKCS12 -storepass:env MINNETRAIL_SIGN_PASS -keypass:env MINNETRAIL_SIGN_PASS -sigalg SHA256withRSA -digestalg SHA-256 -signedjar "$output" "$bundle" minnetrail-upload
jarsigner -verify -verbose -certs "$output" > "$RUNNER_TEMP/bundle-signature.txt"
grep -F 'jar verified.' "$RUNNER_TEMP/bundle-signature.txt"
keytool -printcert -jarfile "$output" > "$RUNNER_TEMP/bundle-certificate.txt"
grep -F 'SHA256: 00:88:01:EB:1D:A9:FF:89:8E:FF:1C:C7:AE:AB:29:E8:34:D2:F3:1E:1A:1E:9C:70:8D:5C:06:0F:DD:8B:C1:E4' "$RUNNER_TEMP/bundle-certificate.txt"
java -jar "$java_tool" validate --bundle="$output"
sha256sum "$output" > "$output.sha256"
