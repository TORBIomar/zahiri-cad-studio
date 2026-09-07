# 🏗️ Zahiri Metal CAD — Architecture

---

## Overview

A browser-based 3D parametric CAD for designing laser-cut metal tubes and exporting CNC-ready files.

```
 User (Browser)          Spring Boot API           MySQL 8
┌──────────────┐        ┌──────────────┐        ┌──────────┐
│  React 18    │  HTTP   │  Java 17+    │  JDBC   │ zahiri_  │
│  Three.js    │◄──────►│  Port 8080   │◄──────►│ cad_db   │
│  Port 5173   │  JSON   │              │        │          │
└──────────────┘        └──────────────┘        └──────────┘
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18 · TypeScript · Vite · Three.js · R3F · CSG · Zustand (CAD + Auth) · Tailwind 4 · Axios · Framer Motion · jsPDF · i18next |
| **Backend** | Java 17 · Spring Boot 3.3 · Spring Security · JJWT (0.12.6) · Spring Data JPA · Hibernate · Lombok · Maven |
| **Database** | MySQL 8 (XAMPP) · HikariCP |
| **Deploy** | Vercel (frontend only) |

---

## File Tree

```
📦 3D-CAD-LASER-CUTTING/
│
├── 🖥️ frontend/
│   ├── src/
│   │   ├── App.tsx                    # Root layout + Auth initialization & Guest Preview bar
│   │   ├── main.tsx                   # Entry point
│   │   │
│   │   ├── components/
│   │   │   ├── HeaderNav.tsx          # Top bar — auth status, menus, export, undo/redo
│   │   │   ├── AuthModal.tsx          # Industrial dark tech modal (Login/Register/Demo/Guest)
│   │   │   ├── UserProfileMenu.tsx    # Header avatar popover & role status
│   │   │   ├── SidebarParameters.tsx  # Left — dimensions, materials, tubes
│   │   │   ├── SidebarReadouts.tsx    # Right — weight, volume, alerts
│   │   │   ├── CutFeatureManager.tsx  # Cut CRUD list
│   │   │   ├── GCodeExportModal.tsx   # G-Code preview & download
│   │   │   ├── ProjectLoadModal.tsx   # Save/Load/Import modal (Cloud + Local)
│   │   │   ├── StatusBar.tsx          # Bottom info bar
│   │   │   └── canvas/
│   │   │       ├── CadCanvas.tsx      # 3D viewport wrapper
│   │   │       ├── ParametricTube.tsx # Tube mesh + CSG cuts
│   │   │       ├── LaserCutEffect.tsx # Laser beam animation
│   │   │       └── Blueprint2DView.tsx# 2D unrolled sheet SVG
│   │   │
│   │   ├── store/
│   │   │   ├── useCadStore.ts         # Zustand — all CAD & 3D state
│   │   │   └── useAuthStore.ts        # Zustand — JWT tokens, user roles, guest preview
│   │   │
│   │   ├── services/
│   │   │   ├── apiClient.ts           # Axios config with JWT Bearer interceptor
│   │   │   ├── projectService.ts      # Save/Load API calls with user metadata
│   │   │   ├── pdfExportService.ts    # PDF generation
│   │   │   └── dxfExportService.ts    # DXF 2D export
│   │   │
│   │   ├── utils/
│   │   │   ├── GCodeGenerator.ts      # CAD state → G-Code
│   │   │   ├── GCodeParser.ts         # G-Code file → CAD state
│   │   │   └── collisionChecker.ts    # Feasibility validation
│   │   │
│   │   ├── i18n/config.ts             # EN / FR setup
│   │   └── locales/{en,fr}/           # Translations (CAD & Auth)
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── ⚙️ backend/
│   └── src/main/java/com/zahirimetal/cad/
│       ├── ZahiriMetalCadBackendApplication.java
│       ├── config/CorsConfig.java
│       ├── security/
│       │   ├── SecurityConfig.java         # Spring Security 3.3 Filter Chain
│       │   ├── JwtService.java             # JJWT token generation & validation
│       │   └── JwtAuthenticationFilter.java# Bearer token request filter
│       ├── controller/
│       │   ├── AuthController.java         # /api/v1/auth (login, register, me)
│       │   └── ProjectController.java      # /api/v1/projects & /api/v1/projects/my
│       ├── dto/
│       │   ├── {AuthRequestDto, RegisterRequestDto, AuthResponseDto, UserDto}.java
│       │   └── {TubeProjectDto, CutFeatureDto}.java
│       ├── entity/
│       │   ├── {User, Role}.java           # User entity with UserDetails & RBAC
│       │   └── {TubeProject, CutFeature}.java
│       ├── repository/
│       │   ├── UserRepository.java
│       │   └── {TubeProject, CutFeature}Repository.java
│       └── service/
│           ├── AuthService.java & impl/AuthServiceImpl.java
│           └── ProjectService.java & impl/ProjectServiceImpl.java
│
├── vercel.json
└── README.md
```

---

## UI Layout

```
┌──────────────────────────────────────────────────────────┐
│                     HeaderNav                            │
│  [New] [Save] [Load] [Import]   [G-Code] [DXF] [PDF]    │
│  [Shaded|Wire|Laser|Blueprint]  [Undo] [Redo] [EN|FR]   │
├──────────┬───────────────────────────────┬───────────────┤
│          │                               │               │
│ Sidebar  │        CadCanvas              │   Sidebar     │
│ Params   │     3D Three.js View          │   Readouts    │
│          │          OR                   │               │
│ • Profile│     Blueprint2DView           │ • Weight (kg) │
│ • Dims   │     2D SVG Unroll             │ • Volume      │
│ • Cuts   │                               │ • Area        │
│ • Material                               │ • Cycle Time  │
│ • Laser  │                               │ • ⚠ Alerts    │
│ • Tubes  │                               │               │
├──────────┴───────────────────────────────┴───────────────┤
│                     StatusBar                            │
└──────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

```mermaid
graph LR
    subgraph Components
        H[HeaderNav]
        SP[SidebarParameters]
        SR[SidebarReadouts]
        CC[CadCanvas]
        PT[ParametricTube]
        BP[Blueprint2DView]
    end

    subgraph State
        Z[useCadStore<br/>Zustand]
    end

    subgraph Services
        API[projectService]
        PDF[pdfExportService]
        DXF[dxfExportService]
    end

    subgraph Utils
        GG[GCodeGenerator]
        GP[GCodeParser]
        CK[collisionChecker]
    end

    H --> Z
    SP --> Z
    SR --> Z
    CC --> PT
    PT --> Z
    BP --> Z
    H --> API
    H --> GG
    H --> PDF
    H --> DXF
    SR --> CK
    API --> Z
```

---

## State Model (Zustand)

```mermaid
classDiagram
    class CadStore {
        tubes: TubeItem[]
        activeTubeId: string
        viewMode: shaded | wireframe | laser_cut | blueprint
        laserPowerKW: number
        assistGas: nitrogen | oxygen
        undoStack / redoStack
    }

    class TubeItem {
        id, name
        profileType: round | square | rectangular
        length, outerRadius, wallThickness
        rectWidth, rectHeight
        position: X Y Z
        rotation: RX RY RZ
        cuts: CutFeature[]
        materialId
    }

    class CutFeature {
        id, name
        type: hole | slot | mitre_start | mitre_end
        positionZ, polarAngle
        radius, slotLength, slotWidth
        mitreAngle, enabled
    }

    CadStore "1" --> "*" TubeItem
    TubeItem "1" --> "*" CutFeature
```

**5 Materials**: Steel 304 · Steel S235 · Aluminum 6061 · Titanium Gr5 · Brass

---

## Backend Architecture

```mermaid
graph TB
    A["ProjectController<br/>@RestController"] --> B["ProjectServiceImpl<br/>@Service"]
    B --> C["TubeProjectRepository<br/>JpaRepository"]
    C --> D[("MySQL<br/>zahiri_cad_db")]

    style A fill:#4f46e5,color:#fff
    style B fill:#0891b2,color:#fff
    style C fill:#059669,color:#fff
    style D fill:#d97706,color:#fff
```

### REST API

| Method | Endpoint | What it does |
|---|---|---|
| `POST` | `/api/v1/projects` | Save project → `201` |
| `GET` | `/api/v1/projects` | List all → `200` |
| `GET` | `/api/v1/projects/{id}` | Get by UUID → `200` |
| `DELETE` | `/api/v1/projects/{id}` | Delete → `204` |

---

## Database Model

```mermaid
erDiagram
    tube_projects ||--o{ cut_features : "has"

    tube_projects {
        UUID id PK
        String project_name
        String material_id
        String profile_type
        Double total_length
        Double outer_diameter
        Double wall_thickness
        Double rect_width
        Double rect_height
        DateTime created_at
        DateTime updated_at
    }

    cut_features {
        UUID id PK
        UUID tube_project_id FK
        String feature_name
        String type
        Double z_offset
        Double polar_angle
        Double cut_diameter
        Double cut_width
        Double cut_length
        Double mitre_angle
        Boolean enabled
    }
```

> ⚠️ Frontend uses `outerRadius` — backend stores `outerDiameter` (x2 conversion in `ProjectServiceImpl`)

---

## Data Flows

### Editing a Parameter

```mermaid
sequenceDiagram
    User->>SidebarParameters: Change slider
    SidebarParameters->>useCadStore: setTubeDimensions()
    useCadStore->>ParametricTube: Re-render 3D
    useCadStore->>SidebarReadouts: Recompute readouts
```

### Exporting G-Code

```mermaid
sequenceDiagram
    User->>HeaderNav: Click Export
    HeaderNav->>GCodeGenerator: generateTubeGCode(state)
    GCodeGenerator-->>User: Preview + Download .nc
```

### Saving a Project

```mermaid
sequenceDiagram
    User->>ProjectService: saveProject()
    alt Backend online
        ProjectService->>SpringBoot: POST /api/v1/projects
        SpringBoot->>MySQL: INSERT
    else Backend offline
        ProjectService->>localStorage: Fallback save
    end
```

---

## CSG Boolean Pipeline

```
Tube Geometry (cylinder / box)
    ── subtract ──► Hole Cylinders
    ── subtract ──► Slot Boxes
    ── subtract ──► Mitre Planes
    ═══════════════► Final Cut Mesh
```

Uses `@react-three/csg` + `three-bvh-csg` for real-time boolean subtraction.

---

## Cut Feature Types

| Type | Shape | Key Params |
|---|---|---|
| `hole` | ⭕ Circle | positionZ, polarAngle, radius |
| `slot` | ▬ Rectangle | positionZ, polarAngle, slotLength, slotWidth |
| `mitre_start` | ╱ Bevel at Z=0 | mitreAngle |
| `mitre_end` | ╲ Bevel at Z=length | mitreAngle |

---

## Feasibility Checks

| Rule | Threshold | Severity |
|---|---|---|
| Cut too close to tube edge | < 15mm | 🔴 Error |
| Two cuts overlapping | < r1+r2+10mm | 🟡 Warning |

---

## How to Run

```powershell
# 1. Database
CREATE DATABASE zahiri_cad_db;

# 2. Backend (port 8080)
cd backend && mvn spring-boot:run

# 3. Frontend (port 5173)
cd frontend && npm install && npm run dev
```

> 💡 Frontend works fully offline — backend only needed for persistent save/load.

---

*TORBI Omar — Zahiri Metal*
