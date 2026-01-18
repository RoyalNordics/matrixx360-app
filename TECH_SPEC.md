# MatriXx360 - Technical Specification

## 1. System Purpose

MatriXx360 er et samlet operations- og styringssystem, som skal understøtte hele CBRE's facility management lifecycle:
1. Første kundekontakt (salg)
2. Behovsafdækning & scope-definition
3. Indhentning og benchmarking af leverandørtilbud
4. Kundetilbud & kontrakter
5. Transition fra salg til drift
6. Løbende drift & service delivery
7. Analyse, compliance & optimering

Systemet skal fungere som både:
- Internt styringsværktøj for CBRE
- Dokumentations- og transparensplatform over for kunden
- Driftsoverblik og beslutningsgrundlag for ledelsen

---

## 2. Core Architectural Principles
- Alt i systemet modelleres som services
- Alle leverancer nedbrydes i service moduler
- Systemet skal være:
  - Datadrevet
  - Modulært
  - Konfigurerbart uden kodning
  - Proof-of-process orienteret (dokumentation og compliance)

---

## 3. Data Model – Core Entities

### 3.1. Customer
- Kundeprofil
- Lokation(er)
- Kontaktpersoner
- Historik
- Branche / type facility

### 3.2. Sales Case

Repræsenterer hele salgsprocessen.

**Felter:**
- Kunde
- Status: Lead → Discovery → Proposal → Negotiation → Won/Lost
- Salgsansvarlig
- Noter og mødelog
- Estimeret scope volumen
- Tilknyttet tilbud

### 3.3. Service (Abstract Layer)

Alt CBRE leverer defineres som services.

**Eksempler:**
- Elevatorservice
- Rengøring
- Rulletrappevedligehold
- Ventilationsservice
- Sikkerhedssystem service

**Services opdeles i:**
- Service Category
- Service Sub-Category
- Service Module

### 3.4. Service Module (Kerneelement)

Et service modul er én konkret og operationel enhed.

**Eksempel:**
- Elevator nr. 3 i stormagasin
- Toilet i stueetagen, indgang B
- Rulletrappe ved parkeringskælderen

**Service Module = én driftsansvarlig enhed**

### 3.5. Service Template System

Systemet skal indeholde en dynamisk template builder.

**En template består af:**
- En række felter udvalgt via checkboxe
- Felter fra globalt feltbibliotek
- Custom felter pr. kunde eller kategori

**Eksempler på felt-typer:**
- Tekst
- Dropdown
- Dato
- Tal
- Filupload
- Leverandør-reference
- SLA-niveau
- Kritikalitet

**Templates bruges til:**
- At oprette nye service moduler
- At sikre konsistens på tværs af sites og kunder

---

## 4. End-to-End Lifecycle Modules

### MODULE A – Sales & Lead Management

**Formål:** Understøtte hele salgsprocessen.

**Funktioner:**
- CRM-system:
  - Leads
  - Kundeemner
  - Kontakter
  - Møde- og aktivitetslog
- Scope-klargøring:
  - Oprettelse af foreløbige service moduler
  - Salgspipeline-status
  - Overdragelse til drift

### MODULE B – Scope & Service Configuration

**Formål:** Definere alt CBRE overtager fra kunden.

**Funktioner:**
- Oprettelse af:
  - Service kategorier
  - Service moduler
- Template-baseret modulopbygning
- Massetildeling:
  - fx "opret 25 toilet-moduler på én gang"
- Visual oversigt pr. bygning/etage/zone
- Bruges direkte i tilbudsfasen

### MODULE C – Procurement & Vendor Benchmarking

**Formål:** Dokumentere og sikre professionel indkøbsproces.

**Funktioner:**

#### 1. Vendor Database
- Godkendte leverandører
- Kategorier
- Geografi
- Kontrakter og priser

#### 2. RFQ / Tender Module

**Workflow:**
1. Brugeren vælger service moduler
2. System genererer teknisk scope automatisk
3. Brugeren vælger min. 3 leverandører
4. System udsender RFQ
5. Leverandører afgiver tilbud online
6. System genererer benchmark oversigt

#### 3. Benchmark Engine

Systemet genererer en real-time sammenligning:
- Pris
- SLA
- Leverandørscore
- Historisk performance
- ESG-score

**Mulighed for vægtning:**
- Pris
- Kvalitet
- Risiko

#### 4. Compliance Logging

Systemet gemmer automatisk:
- At min. 3 leverandører er kontaktet
- Tilbudshistorik
- Valgt leverandør og begrundelse
- Audit-logs

### MODULE D – Customer Proposal & Contracting

**Formål:** Strukturere tilbud til kunden.

**Funktioner:**
- Automatisk generering af kundetilbud:
  - Baseret på scope og servicer
- Prisstruktur:
  - Per service modul
  - Per kategori
- Kontraktgenerator
- SLA-definitioner
- e-Signature integration

### MODULE E – Transition Management

**Formål:** Overgang fra salg til drift.

**Funktioner:**
- Transition checkliste
- Overdragelsesdashboard:
  - Services
  - Leverandører
  - SLA'er
  - Teknik
- Dokumentationsoverførsel
- Aktivering af drift workflows

### MODULE F – Service Delivery & Operations

**Formål:** Daglig drift og vedligehold.

**Funktioner:**
- Work Order Management
- Automatic scheduling
- Technician mobile app
- Service logs pr. modul
- Incident & escalation handling

### MODULE G – Customer Portal

**Formål:** Skabe transparens og tryghed.

**Funktioner:**
- Live dashboard
- Serviceoversigt
- Historik
- SLA status
- Indkøbsdokumentation
- Drift-rapporter
- Beskedcenter

### MODULE H – Analytics & Strategy

**Formål:** Datadrevet beslutning.

**Funktioner:**
- KPI dashboards
- Predictive maintenance
- Supplier performance
- Cost optimization
- Risk heatmaps
- ESG og compliance tracking

---

## 5. Trust & Transparency Layer

MatriXx360 skal være designet til at skabe tillid:
- Alle beslutninger dokumenteres
- Alle leverandørvalg kan forklares
- Alle services er synlige for kunden
- Alle ændringer logges (audit trail)

---

## 6. Unique Value Proposition (USP)

MatriXx360 gør CBRE i stand til at:
- Dokumentere alle processer fra første kontakt til drift
- Skabe gennemsigtighed i leverandørvalg
- Standardisere kompleks FM-drift på tværs af kunder
- Skabe en professionel, kontrolleret og tillidsfuld kundeoplevelse
