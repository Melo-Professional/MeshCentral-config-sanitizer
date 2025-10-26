# MeshCentral Config Sanitizer

[![GitHub Repo stars](https://img.shields.io/github/stars/Melo-Professional/MeshCentral-config-sanitizer?style=social)](https://github.com/Melo-Professional/MeshCentral-config-sanitizer) [![GitHub forks](https://img.shields.io/github/forks/Melo-Professional/MeshCentral-config-sanitizer)](https://github.com/Melo-Professional/MeshCentral-config-sanitizer/forks) [![License](https://img.shields.io/github/license/Melo-Professional/MeshCentral-config-sanitizer)](https://github.com/Melo-Professional/MeshCentral-config-sanitizer/blob/main/LICENSE)

A lightweight, self-contained web tool to securely sanitize `config.json` files for MeshCentral servers. Easily redact sensitive data like passwords, domains, IPs, and user details before sharing configs publicly—without compromising structure or usability.

Perfect for developers, admins, and support teams troubleshooting MeshCentral setups while protecting privacy.

## 🌐 Live Demo

Access the online tool here:  
👉 **[https://sanitizer.meshcentraltools.com/](https://sanitizer.meshcentraltools.com/)**

## ⚙️ Features

- **Sensitive Data Redaction**: Automatically replaces passwords, keys, session secrets, and other critical values with `REDACTED`.
- **Domain & IP Anonymization**: 
  - Replaces custom domains with placeholders like `domain-1.com` (preserving subdomains, e.g., `sub.domain-1.com`).
  - Redacts external IPs (internal networks like 192.168.x.x are preserved).
  - Ignores known public domains (e.g., `google.com`, `cloudflare.com`, `meshcentral.com`).
- **User/Group Anonymization**: Converts user paths (e.g., `user/mysecretdomain/mysecretuser`) to safe placeholders like `user/domain-1/user-1`.
- **Irrelevant Cleanup**: Removes UI/comments/customization keys (e.g., titles, images, session recording) for a lean, shareable config.
- **Preserves Schema**: Maintains JSON validity and `$schema` untouched for seamless re-use.
- **Offline & Portable**: Single HTML file—no server, installs, or dependencies. Run locally via browser.


## 🚀 Usage

1. Open the live demo link above.  
2. Load your existing `config.json` or paste.  
3. Sanitize, cleanup as you need.  
4. Validate, preview, copy or export the generated configuration file.

### Example Before/After
**Before** (snippet):
```json
{
  "cert": "mysupermeshcentral.mycompany.com",
  "sessionKey": "Xv50x8RpUw<zYeCOhG?'f,wZ:?)b6yPC*z-,pVB]j-4TX&vZ^C/jL}gCyK*ZL%<!",
  "_agentIdleTimeout": 120,
  "title": "My Company",
  "welcomePicture": "symbol_600x339_alpha.png"
}
```

**After Hide Sensitive**:
```json
{
  "cert": "mysupermeshcentral.domain-1.com",
  "sessionKey": "REDACTED",
  "_agentIdleTimeout": 120,
  "title": "REDACTED",
  "welcomePicture": "REDACTED"
}
```

**After Remove Irrelevant** (further cleanup):
```json
{
  "cert": "mysupermeshcentral.domain-1.com",
  "sessionKey": "REDACTED"
}
```

## 🤝 Contributing
Fork, improve, and PR! Ideas for enhancements are welcome.

## 📄 License
Apache 2.0 License—free to use, modify, and distribute. See [LICENSE](LICENSE).

---

**Built with ❤️ by [Melo](https://github.com/Melo-Professional)**  
*Feedback? Open an issue or star the repo!*
