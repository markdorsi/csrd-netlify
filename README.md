# Netlify Emissions Estimator

A comprehensive web application for calculating and reporting carbon emissions from Netlify infrastructure usage.

## Features

- **Multi-modal Emissions Calculation**: Calculate both Scope 1+2 (via AWS CCFT inputs) and total-chain proxy emissions
- **Sensitivity Analysis**: Low/mid/high estimates to account for uncertainty in network infrastructure energy consumption
- **Professional Reports**: Generate printable, branded reports with detailed methodology
- **Data Persistence**: Store and retrieve emissions runs using Netlify Blobs
- **Transparent Factors**: All emission factors are visible and adjustable
- **Per-unit Metrics**: Calculate emissions per user, per system, and per GB transferred

## Architecture

- **Frontend**: React with TypeScript and Vite
- **Backend**: Netlify Functions for calculations and data persistence
- **Storage**: Netlify Blobs for multi-tenant data storage
- **Deployment**: Fully optimized for Netlify hosting

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Deploy using naxp**:
   ```bash
   naxp deploy prod
   ```

## Usage

1. **Data Entry**: Enter your monthly Netlify usage metrics including bandwidth, storage, build minutes, and functions usage
2. **CCFT Integration**: Optionally paste AWS Climate Change Foot Tool Scope 1+2 data
3. **Factor Adjustment**: Customize emission factors for your specific use case
4. **Results Analysis**: View comprehensive emissions breakdowns with sensitivity analysis
5. **Report Generation**: Generate printable reports or save data for future reference

## Calculation Methodology

### Network Emissions
```
Emissions = Bandwidth × Network Energy Intensity × PUE × Grid Carbon Intensity
```

### Default Factors
- Grid intensity: 0.494 kg CO₂e/kWh (global average)
- PUE: 1.135 (modern data center average)
- Network energy: 10-72 Wh/GB (low/mid/high scenarios)

### Sensitivity Bands
Three scenarios reflect uncertainty in network infrastructure energy consumption:
- **Low**: Conservative estimate (10 Wh/GB)
- **Mid**: Mid-range estimate (30 Wh/GB)
- **High**: High-end estimate including full infrastructure (72 Wh/GB)

## API Endpoints

- `POST /api/calculate` - Calculate emissions from inputs and factors
- `POST /api/save-run` - Save emission run to Netlify Blobs
- `GET /api/get-run` - Retrieve saved emission run
- `GET /api/list-runs` - List saved runs for a tenant

## Data Model

The application supports multi-tenant usage with data stored per tenant and period:

```
/tenants/{tenant_id}.json          # Tenant information
/runs/{tenant_id}/{period}.json    # Emission calculation runs
/factors/{tenant_id}.json          # Custom emission factors
```

## Technology Stack

- **React 18** - Frontend framework
- **TypeScript** - Type safety
- **Vite** - Build tool and development server
- **Netlify Functions** - Serverless API endpoints
- **Netlify Blobs** - Data storage
- **CSS Grid/Flexbox** - Responsive layout
- **Print CSS** - Professional report generation

## Compliance & Reporting

The tool supports CSRD (Corporate Sustainability Reporting Directive) requirements by providing:

- Transparent methodologies
- Auditable calculations
- Professional reports
- Data export capabilities (JSON format)
- Historical tracking
- Per-unit normalized metrics

This project was bootstrapped with [naxp](https://github.com/markdorsi/naxp).
