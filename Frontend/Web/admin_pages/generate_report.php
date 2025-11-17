<?php
// Requires the FPDF library from the specified path
require('../lib/fpdf186/fpdf.php');

// A custom PDF class for a branded look
class PDF extends FPDF {
    private $brandColor = [0, 74, 173]; // LaundroLink Blue

    // Page header: Platform-centric title
    function Header() {
        // Arial bold 15 for Title
        $this->SetFont('Arial', 'B', 15);
        $this->SetTextColor($this->brandColor[0], $this->brandColor[1], $this->brandColor[2]);
        // Center the title
        $this->Cell(0, 10, 'LaundroLink Platform Performance Report', 0, 1, 'C');
        // Line break
        $this->Ln(10);
    }

    // Page footer
    function Footer() {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->SetTextColor(128); // Gray color
        $this->Cell(0, 10, 'Page ' . $this->PageNo() . ' of {nb}', 0, 0, 'C');
    }

    // A reusable function for section headers
    function SectionTitle($title) {
        $this->SetFont('Arial', 'B', 14);
        $this->SetTextColor($this->brandColor[0], $this->brandColor[1], $this->brandColor[2]);
        $this->Cell(0, 10, $title, 0, 1, 'L');
        $this->SetDrawColor($this->brandColor[0], $this->brandColor[1], $this->brandColor[2]);
        $this->Line($this->GetX(), $this->GetY(), $this->GetX() + 190, $this->GetY());
        $this->Ln(5);
    }
}

// --- Main PDF Generation Logic ---

$pdf = new PDF();
$pdf->AliasNbPages();
$pdf->AddPage();

// Function to safely clean text for FPDF, specifically targeting the Peso sign and UTF-8 issues.
function sanitize_for_pdf($text) {
    // Remove the UTF-8 peso sign and any mangled characters it might become.
    $cleaned_text = str_replace(['₱', '?', 'â‚±'], '', $text);
    // Then, decode the rest of the string for FPDF compatibility.
    return utf8_decode(trim($cleaned_text));
}

// --- Get and Sanitize Data from Frontend ---
// 1. KPIs
$kpis_raw = json_decode($_POST['kpis'] ?? '[]', true);
$kpis = [];
foreach ($kpis_raw as $title => $value) {
    $kpis[sanitize_for_pdf($title)] = sanitize_for_pdf($value);
}

// 2. Top Shops List (renamed from 'staff' to 'topShops' for Admin context)
$shops_raw = json_decode($_POST['topShops'] ?? '[]', true);
$topShops = [];
foreach ($shops_raw as $shop) {
    $topShops[] = [
        'name' => sanitize_for_pdf($shop['name']),
        'revenue' => sanitize_for_pdf($shop['revenue'])
    ];
}

// 3. Metadata and Images
$period = sanitize_for_pdf(htmlspecialchars($_POST['period'] ?? 'Selected Period'));
$salesTrendImg = $_POST['salesTrendImg'] ?? '';
$orderStatusImg = $_POST['orderStatusImg'] ?? '';

$brandColor = [0, 74, 173]; // LaundroLink Blue

// --- 1. Report Sub-header ---
$pdf->SetFont('Arial', 'B', 18);
$pdf->SetTextColor(50, 50, 50);
$pdf->Cell(0, 10, 'Platform Overview', 0, 1, 'L');
$pdf->SetFont('Arial', '', 12);
$pdf->SetTextColor(100, 100, 100);
$pdf->Cell(0, 8, 'Reporting Period: ' . $period, 0, 1, 'L');
$pdf->Ln(7);

// --- 2. KPI Section ---
$pdf->SectionTitle('Key Platform Performance Indicators');

$kpi_keys = array_keys($kpis);
$cellWidth = 47.5; 
$cellHeight = 22;

for ($i = 0; $i < count($kpi_keys); $i++) {
    $title = $kpi_keys[$i];
    $value = $kpis[$title];
    $x = $pdf->GetX();
    $y = $pdf->GetY();
    
    // Draw card background
    $pdf->SetFillColor(255, 255, 255);
    $pdf->SetDrawColor(220, 220, 220);
    $pdf->Rect($x, $y, $cellWidth, $cellHeight, 'DF');
    
    // Draw top line in brand color
    $pdf->SetDrawColor($brandColor[0], $brandColor[1], $brandColor[2]);
    $pdf->SetLineWidth(1);
    $pdf->Line($x, $y, $x + $cellWidth, $y);
    $pdf->SetLineWidth(0.2);

    // KPI Title
    $pdf->SetXY($x, $y + 4);
    $pdf->SetFont('Arial', '', 9);
    $pdf->SetTextColor(120, 120, 120);
    $pdf->Cell($cellWidth, 6, $title, 0, 1, 'C');

    // KPI Value
    $pdf->SetXY($x, $y + 11);
    $pdf->SetFont('Arial', 'B', 16);
    $pdf->SetTextColor(50, 50, 50);
    $pdf->Cell($cellWidth, 8, $value, 0, 1, 'C');
    
    // Move cursor to the next column for the next card
    if ($i < count($kpi_keys) - 1) {
        $pdf->SetXY($x + $cellWidth, $y);
    }
}
$pdf->Ln($cellHeight + 8);

// --- 3. Visualizations Section (Sales Trend and Order Status Breakdown) ---
$pdf->SectionTitle('Platform Visualizations');

$y_charts = $pdf->GetY();
$pdf->SetFont('Arial', 'B', 11);
$pdf->SetTextColor(80, 80, 80);

// Sales Trend Chart
$pdf->Cell(120, 8, 'Platform Revenue Trend', 0, 0, 'C');
$salesTrendImgData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $salesTrendImg));
$salesTrendFile = 'temp_sales_trend_admin.png';
file_put_contents($salesTrendFile, $salesTrendImgData);
$pdf->Image($salesTrendFile, $pdf->GetX() - 118, $y_charts + 10, 110);
unlink($salesTrendFile);

// Order Status Breakdown Chart
$pdf->SetXY(130, $y_charts);
$pdf->Cell(70, 8, 'Order Status Breakdown', 0, 1, 'C');
$orderStatusImgData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $orderStatusImg));
$orderStatusFile = 'temp_order_status_admin.png';
file_put_contents($orderStatusFile, $orderStatusImgData);
$pdf->Image($orderStatusFile, $pdf->GetX() + 122, $y_charts + 10, 65);
unlink($orderStatusFile);

$pdf->Ln(85); // Move cursor down after charts

// --- 4. Top Shops Section ---
$pdf->SectionTitle('Top 10 Shops (by Revenue)');

$pdf->SetFont('Arial', 'B', 12);
$pdf->SetFillColor($brandColor[0], $brandColor[1], $brandColor[2]);
$pdf->SetTextColor(255, 255, 255);
$pdf->Cell(130, 10, 'Shop Name', 1, 0, 'L', true);
$pdf->Cell(60, 10, 'Revenue', 1, 1, 'C', true);

$pdf->SetFont('Arial', '', 12);
$pdf->SetTextColor(0, 0, 0);
$pdf->SetFillColor(245, 245, 245);
$fill = false;

if (empty($topShops)) {
    $pdf->Cell(190, 10, 'No shop revenue data available for this period.', 1, 1, 'C');
} else {
    foreach ($topShops as $shop) {
        $pdf->Cell(130, 10, $shop['name'], 'LR', 0, 'L', $fill);
        $pdf->Cell(60, 10, $shop['revenue'], 'LR', 1, 'R', $fill);
        $fill = !$fill;
    }
}
$pdf->Cell(190, 0, '', 'T'); // Closing border line

// --- 5. Output the PDF ---
$filename = "LaundroLink_Platform_Report_" . date('Y-m-d') . ".pdf";
$pdf->Output('D', $filename);
exit;