---
tags:
  - note
  - infra
  - wsl
---

# WSL ↔ Windows Port Forwarding

Chrome debug ports (19301-19350) listen on `127.0.0.1` only. WSL accesses Windows via `172.30.144.1`, so netsh portproxy rules are needed to forward `172.30.144.1:port → 127.0.0.1:port`.

**Known issue**: After Windows reboot, portproxy rules appear in `netsh interface portproxy show v4tov4` but don't actually work. Must reset and re-add:

```powershell
# Run as Administrator in PowerShell
netsh interface portproxy reset
for ($port = 19301; $port -le 19350; $port++) {
    netsh interface portproxy add v4tov4 listenaddress=172.30.144.1 listenport=$port connectaddress=127.0.0.1 connectport=$port
}
Restart-Service iphlpsvc -Force
```

**When Chrome startup times out in the mcporter wrapper**, the most likely cause is this portproxy issue after a reboot. Remind the user to re-apply the rules.
