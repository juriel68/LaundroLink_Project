<?php
require('../lib/fpdf186/fpdf.php');

// A custom PDF class for a branded look
class PDF extends FPDF {
    private $brandColor = [0, 74, 173]; // LaundroLink Blue

    // Page header
    function Header() {
        // Arial bold 15 for Title
        $this->SetFont('Arial', 'B', 15);
        $this->SetTextColor($this->brandColor[0], $this->brandColor[1], $this->brandColor[2]);
        // Center the title
        $this->Cell(0, 10, 'LaundroLink Performance Report', 0, 1, 'C');
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

// Helper to handle encoding and currency symbols
function sanitize_for_pdf($text) {
    // 1. Remove currency symbols that FPDF hates
    $cleaned = str_replace(['₱', '?', 'â‚±'], '', $text);
    
    // 2. Convert to ISO-8859-1 (Standard for FPDF)
    // If text is UTF-8, decode it first
    return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', trim($cleaned));
}

// --- Get and Sanitize Data from Frontend ---
$kpis_raw = json_decode($_POST['kpis'], true);
$kpis = [];
if ($kpis_raw) {
    foreach ($kpis_raw as $title => $value) {
        $kpis[sanitize_for_pdf($title)] = sanitize_for_pdf($value);
    }
}

$staff_raw = json_decode($_POST['staff'], true); // This now contains Transactions
$transactions = [];
if ($staff_raw) {
    foreach ($staff_raw as $item) {
        $transactions[] = [
            'details' => sanitize_for_pdf($item['name']), // ID + Date
            'amount' => sanitize_for_pdf($item['revenue']) // Amount
        ];
    }
}

$period = sanitize_for_pdf(htmlspecialchars($_POST['period']));
$shopName = sanitize_for_pdf(htmlspecialchars($_POST['shopName']));
$brandColor = [0, 74, 173];

// --- 1. Report Sub-header ---
$pdf->SetFont('Arial', 'B', 18);
$pdf->SetTextColor(50, 50, 50);
$pdf->Cell(0, 10, $shopName . ' Report', 0, 1, 'L');

$pdf->SetFont('Arial', '', 12);
$pdf->SetTextColor(100, 100, 100);
$pdf->Cell(0, 8, 'Period: ' . $period, 0, 1, 'L');
$pdf->Ln(7);

// --- 2. KPI Section ---
$pdf->SectionTitle('Key Performance Indicators');

$kpi_keys = array_keys($kpis);
$cellWidth = 47.5; 
$cellHeight = 22;

for ($i = 0; $i < count($kpi_keys); $i++) {
    $title = $kpi_keys[$i];
    $value = $kpis[$title];
    $x = $pdf->GetX();
    $y = $pdf->GetY();
    
    // Draw Box
    $pdf->SetFillColor(255, 255, 255);
    $pdf->SetDrawColor(220, 220, 220);
    $pdf->Rect($x, $y, $cellWidth, $cellHeight, 'DF');
    
    // Colored Top Border
    $pdf->SetDrawColor($brandColor[0], $brandColor[1], $brandColor[2]);
    $pdf->SetLineWidth(1);
    $pdf->Line($x, $y, $x + $cellWidth, $y);
    $pdf->SetLineWidth(0.2);

    // Title
    $pdf->SetXY($x, $y + 4);
    $pdf->SetFont('Arial', '', 9);
    $pdf->SetTextColor(120, 120, 120);
    $pdf->Cell($cellWidth, 6, $title, 0, 1, 'C');

    // Value
    $pdf->SetXY($x, $y + 11);
    $pdf->SetFont('Arial', 'B', 16);
    $pdf->SetTextColor(50, 50, 50);
    $pdf->Cell($cellWidth, 8, $value, 0, 1, 'C');
    
    // Move cursor for next box
    if ($i < count($kpi_keys) - 1) {
        $pdf->SetXY($x + $cellWidth, $y);
    }
}
$pdf->Ln($cellHeight + 12); // Add some space after KPIs

// --- 3. Visualizations Section ---
$pdf->SectionTitle('Visualizations');
$y_charts = $pdf->GetY();

// Add Chart Titles
$pdf->SetFont('Arial', 'B', 11);
$pdf->SetTextColor(80, 80, 80);
$pdf->Cell(95, 8, 'Sales Trend', 0, 0, 'C');
$pdf->Cell(95, 8, 'Order Type Breakdown', 0, 1, 'C');

// Process and Add Images
$imageY = $pdf->GetY() + 2;

if (isset($_POST['salesTrendImg']) && !empty($_POST['salesTrendImg'])) {
    $salesData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $_POST['salesTrendImg']));
    $salesFile = 'temp_sales.png';
    file_put_contents($salesFile, $salesData);
    // x, y, w, h
    $pdf->Image($salesFile, 15, $imageY, 80, 0); 
    unlink($salesFile);
}

if (isset($_POST['orderTypeImg']) && !empty($_POST['orderTypeImg'])) {
    $orderData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $_POST['orderTypeImg']));
    $orderFile = 'temp_order.png';
    file_put_contents($orderFile, $orderData);
    // x, y, w, h
    $pdf->Image($orderFile, 115, $imageY, 80, 0);
    unlink($orderFile);
}

// Move cursor down past images (adjust based on image height ~60-80 units)
$pdf->Ln(70); 

// --- 4. Recent Transactions Section (Formerly Top Staff) ---
$pdf->SectionTitle('Recent Transactions');

// Table Header
$pdf->SetFont('Arial', 'B', 11);
$pdf->SetFillColor($brandColor[0], $brandColor[1], $brandColor[2]);
$pdf->SetTextColor(255, 255, 255);
$pdf->Cell(130, 10, 'Transaction Details (ID & Date)', 1, 0, 'L', true);
$pdf->Cell(60, 10, 'Amount (PHP)', 1, 1, 'C', true);

// Table Body
$pdf->SetFont('Arial', '', 11);
$pdf->SetTextColor(0, 0, 0);
$pdf->SetFillColor(245, 245, 245);
$fill = false;

if (empty($transactions)) {
    $pdf->Cell(190, 10, 'No paid transactions found for this period.', 1, 1, 'C');
} else {
    foreach ($transactions as $txn) {
        $pdf->Cell(130, 10, $txn['details'], 'LR', 0, 'L', $fill);
        $pdf->Cell(60, 10, $txn['amount'], 'LR', 1, 'C', $fill);
        $pdf->Ln();
        $fill = !$fill; // Toggle row color
    }
}
// Table Footer Line
$pdf->Cell(190, 0, '', 'T');

// --- 5. Output the PDF ---
$filename = "LaundroLink_Report_" . date('Y-m-d') . ".pdf";
$pdf->Output('D', $filename);
exit;
?>