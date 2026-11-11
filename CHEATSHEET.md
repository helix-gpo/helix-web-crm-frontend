# Helix GPO Infra - Cheatsheet

Alle Befehle für PowerShell (nicht cmd). AWS-Befehle laufen gegen Account `811260109493`, Region `eu-central-1`.

---

## 1. AWS-Login (jedes neue Terminal)

```powershell
aws sso login --profile helix-admin     # Browser-Login, gilt 8 Stunden
$env:AWS_PROFILE = "helix-admin"        # gilt nur für dieses Terminal
aws sts get-caller-identity             # Kontrolle: muss ...AdministratorAccess.../felix zeigen
```

- Fehler `Token has expired` / `403 Forbidden`: Session abgelaufen oder `AWS_PROFILE` nicht gesetzt - beide Zeilen oben wiederholen.
- `helix-crm` ist der eingeschränkte App-User für die lokale Backend-Entwicklung - **nicht** für Terraform verwenden.

---

## 2. Terraform

Immer im Ordner `helix-gpo-infra\terraform` ausführen.

| Befehl | Wozu |
|---|---|
| `terraform init` | Provider laden, mit dem State-Bucket verbinden. Nötig beim ersten Mal und nach neuen Providern/Backend-Änderungen. |
| `terraform fmt` | Formatiert alle `.tf`-Dateien einheitlich. Vor jedem Commit. |
| `terraform validate` | Prüft die Syntax, ohne AWS zu fragen. |
| `terraform plan` | Trockenlauf: zeigt `+` anlegen, `~` ändern, `-` löschen. **Immer lesen vor apply.** |
| `terraform apply` | Führt den Plan aus, fragt vorher nach (`yes`). |
| `terraform output` | Zeigt alle Outputs (IDs, Hostnamen, ARNs). |
| `terraform output -raw <name>` | Einzelnen Output ohne Anführungszeichen, z.B. für Skripte. |
| `terraform state list` | Alle Ressourcen, die Terraform verwaltet. |

**Regeln**
- `plan` muss nach jedem `apply` "No changes" zeigen - sonst wurde etwas per Hand in der Konsole geändert.
- Taucht im `plan` ein `-` (destroy) oder `-/+` (replace) auf, das du nicht erwartest: **nicht** `yes` eingeben, erst klären.
- Nie `terraform destroy` auf Prod. Die Datenbank hat zusätzlich Löschschutz.
- Ressourcen nicht per Hand in der Konsole ändern, sondern im Code.
- In Git gehören: `*.tf`, `.terraform.lock.hcl`, `.gitignore`. Nicht in Git: `.terraform/`, `*.tfstate*`, `*.tfvars`.

**State**
- Liegt in `s3://helix-gpo-terraform-state-811260109493/prod/terraform.tfstate` (versioniert, verschlüsselt).
- Kaputter State: in der S3-Konsole beim Objekt unter "Versions" eine ältere Version wiederherstellen.

---

## 3. Bastion-Host (SQL-Zugriff auf Prod)

Im Ordner `helix-gpo-infra\terraform`, damit `terraform output` funktioniert.

### Starten / Stoppen / Status
```powershell
aws ec2 start-instances --instance-ids (terraform output -raw bastion_instance_id)
aws ec2 stop-instances  --instance-ids (terraform output -raw bastion_instance_id)

# bereit für den Tunnel, wenn PingStatus = Online (1-2 Minuten nach dem Start)
aws ssm describe-instance-information --query "InstanceInformationList[].[InstanceId,PingStatus]" --output text
```
Gestoppt kostet er nur ca. 0,70 EUR/Monat (Festplatte). Nach Gebrauch stoppen.

### Tunnel zur Datenbank
Voraussetzung: Session Manager Plugin für die AWS CLI ist installiert.

```powershell
$db      = terraform output -raw db_address
$bastion = terraform output -raw bastion_instance_id

aws ssm start-session `
  --target $bastion `
  --document-name AWS-StartPortForwardingSessionToRemoteHost `
  --parameters "host=$db,portNumber=3306,localPortNumber=3310"
```
- Terminal offen lassen, solange der Tunnel gebraucht wird. Beenden mit `Strg + C`.
- Lokaler Port ist `3310`, weil `3307` von der lokalen Docker-MySQL belegt ist.

### Verbindung im SQL-Client (IntelliJ / MySQL Workbench)
| Feld | Wert |
|---|---|
| Host | `localhost` |
| Port | `3310` |
| Datenbank | `helix_gpo_crm` |
| SSL | erforderlich (`sslMode=REQUIRED`) - die DB lehnt Verbindungen ohne TLS ab |
| User / Passwort | siehe unten |

### Passwörter holen
```powershell
# Admin (helix_admin) - wird von RDS automatisch rotiert, also jedes Mal neu holen
aws secretsmanager get-secret-value --secret-id (terraform output -raw db_master_secret_arn) --query SecretString --output text

# App-User des Backends (helix_app) - keine Rotation
aws secretsmanager get-secret-value --secret-id helix-prod/db-app --query SecretString --output text
```
Passwörter nicht in Dateien, Chats oder Tickets kopieren.

---

## 4. Lokale Entwicklung

### Docker-Prod-Simulation (Ordner `helix-gpo-infra`)
```powershell
docker compose up -d                  # alles im Hintergrund starten
docker compose up -d --build backend  # Backend nach Code-Änderung neu bauen
docker compose logs -f backend        # Logs ansehen (Strg + C beendet nur die Ansicht)
docker compose ps                     # Status
docker compose down                   # stoppen, Daten bleiben
docker compose down -v                # stoppen UND Datenbank löschen (frischer Start)
```

### Tests
```powershell
mvn test                     # Backend (Ordner web-crm), Docker muss laufen (Testcontainers)
npx ng test --watch=false    # CRM-Frontend
npm run e2e                  # Website, Playwright
```

---

## 5. Ressourcen-Überblick (Prod)

| Was | Name in AWS |
|---|---|
| VPC | `helix-prod-vpc` (10.20.0.0/16) |
| Subnets | `helix-prod-public-eu-central-1a/b`, `helix-prod-private-eu-central-1a/b` |
| Security Groups | `helix-prod-alb`, `-backend`, `-website`, `-db`, `-bastion` |
| Datenbank | `helix-prod-mysql` (MySQL 8.4, db.t4g.micro), DB `helix_gpo_crm` |
| Bastion | `helix-prod-bastion` (t4g.nano, nur SSM, keine offenen Ports) |
| Secrets | RDS-Admin-Secret (`rds!db-...`), `helix-prod/db-app` |
| Terraform-State | S3 `helix-gpo-terraform-state-811260109493` |

Alle Ressourcen tragen die Tags `Project=helix-gpo`, `Environment=prod`, `ManagedBy=terraform` - im Cost Explorer nach `Project` filtern, um die CRM-Kosten zu sehen.
