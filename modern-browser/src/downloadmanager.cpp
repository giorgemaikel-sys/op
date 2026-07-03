#include "downloadmanager.h"
#include <QLabel>
#include <QProgressBar>
#include <QPushButton>
#include <QHBoxLayout>
#include <QListWidgetItem>
#include <QDesktopServices>
#include <QDir>

DownloadItem::DownloadItem(const QString &fileName, const QUrl &sourceUrl,
                           qint64 totalBytes, QWidget *parent)
    : QWidget(parent), totalSize(totalBytes), isCompleted(false)
{
    layout = new QVBoxLayout(this);
    layout->setContentsMargins(5, 5, 5, 5);
    layout->setSpacing(5);
    
    // File name label
    fileNameLabel = new QLabel(fileName);
    fileNameLabel->setFont(QFont("Segoe UI", 10, QFont::Bold));
    fileNameLabel->setWordWrap(true);
    
    // Progress bar
    progressBar = new QProgressBar();
    progressBar->setMinimum(0);
    progressBar->setMaximum(100);
    progressBar->setValue(0);
    progressBar->setFormat("%p%");
    progressBar->setStyleSheet(
        "QProgressBar {"
        "    border: 1px solid #ccc;"
        "    border-radius: 5px;"
        "    text-align: center;"
        "}"
        "QProgressBar::chunk {"
        "    background-color: #0078d4;"
        "}"
    );
    
    // Progress label
    progressLabel = new QLabel("Starting...");
    progressLabel->setFont(QFont("Segoe UI", 9));
    
    // Buttons layout
    QHBoxLayout *buttonLayout = new QHBoxLayout();
    buttonLayout->setSpacing(5);
    
    // Cancel button
    cancelButton = new QPushButton("Cancel");
    cancelButton->setFixedSize(70, 28);
    cancelButton->setStyleSheet(
        "QPushButton {"
        "    background-color: #dc3545;"
        "    color: white;"
        "    border: none;"
        "    border-radius: 4px;"
        "}"
        "QPushButton:hover {"
        "    background-color: #c82333;"
        "}"
    );
    
    // Open button (initially disabled)
    openButton = new QPushButton("Open");
    openButton->setFixedSize(70, 28);
    openButton->setEnabled(false);
    openButton->setStyleSheet(
        "QPushButton {"
        "    background-color: #28a745;"
        "    color: white;"
        "    border: none;"
        "    border-radius: 4px;"
        "}"
        "QPushButton:hover {"
        "    background-color: #218838;"
        "}"
        "QPushButton:disabled {"
        "    background-color: #cccccc;"
        "}"
    );
    
    buttonLayout->addWidget(progressLabel);
    buttonLayout->addStretch();
    buttonLayout->addWidget(cancelButton);
    buttonLayout->addWidget(openButton);
    
    // Add widgets to main layout
    layout->addWidget(fileNameLabel);
    layout->addWidget(progressBar);
    layout->addLayout(buttonLayout);
    
    setMaximumHeight(120);
}

void DownloadItem::updateProgress(qint64 receivedBytes, qint64 totalBytes)
{
    if (totalBytes > 0) {
        int percentage = static_cast<int>((receivedBytes * 100) / totalBytes);
        progressBar->setValue(percentage);
        
        QString receivedStr;
        QString totalStr;
        
        if (totalBytes < 1024) {
            receivedStr = QString::number(receivedBytes) + " B";
            totalStr = QString::number(totalBytes) + " B";
        } else if (totalBytes < 1024 * 1024) {
            receivedStr = QString::number(receivedBytes / 1024.0, 'f', 1) + " KB";
            totalStr = QString::number(totalBytes / 1024.0, 'f', 1) + " KB";
        } else if (totalBytes < 1024 * 1024 * 1024) {
            receivedStr = QString::number(receivedBytes / (1024.0 * 1024.0), 'f', 1) + " MB";
            totalStr = QString::number(totalBytes / (1024.0 * 1024.0), 'f', 1) + " MB";
        } else {
            receivedStr = QString::number(receivedBytes / (1024.0 * 1024.0 * 1024.0), 'f', 1) + " GB";
            totalStr = QString::number(totalBytes / (1024.0 * 1024.0 * 1024.0), 'f', 1) + " GB";
        }
        
        progressLabel->setText(QString("%1 / %2").arg(receivedStr).arg(totalStr));
    } else {
        progressLabel->setText("Downloading...");
    }
}

void DownloadItem::setCompleted()
{
    isCompleted = true;
    progressBar->setValue(100);
    progressLabel->setText("Download complete!");
    cancelButton->setEnabled(false);
    cancelButton->setText("Done");
    openButton->setEnabled(true);
}

void DownloadItem::setCancelled()
{
    progressBar->setValue(0);
    progressLabel->setText("Cancelled");
    cancelButton->setEnabled(false);
    openButton->setEnabled(false);
}

// DownloadManager implementation
DownloadManager::DownloadManager(QWidget *parent)
    : QDialog(parent), downloadCount(0)
{
    setWindowTitle("Downloads");
    setMinimumSize(500, 300);
    resize(600, 400);
    
    QVBoxLayout *mainLayout = new QVBoxLayout(this);
    
    downloadList = new QListWidget();
    downloadList->setSpacing(5);
    mainLayout->addWidget(downloadList);
    
    // Auto-cleanup timer for finished downloads
    cleanupTimer = new QTimer(this);
    cleanupTimer->setInterval(5000); // Check every 5 seconds
    connect(cleanupTimer, &QTimer::timeout, this, &DownloadManager::cleanupFinishedDownloads);
    cleanupTimer->start();
}

DownloadManager::~DownloadManager()
{
}

void DownloadManager::addDownload(QWebEngineDownloadRequest *download)
{
    if (!download) return;
    
    QString fileName = download->downloadFileName();
    QUrl sourceUrl = download->url();
    qint64 totalBytes = download->totalBytes();
    
    // Create download item widget
    DownloadItem *itemWidget = new DownloadItem(fileName, sourceUrl, totalBytes);
    
    // Create list widget item
    QListWidgetItem *listItem = new QListWidgetItem(downloadList);
    listItem->setSizeHint(itemWidget->sizeHint());
    downloadList->addItem(listItem);
    downloadList->setItemWidget(listItem, itemWidget);
    
    // Store reference
    downloadItems[download] = itemWidget;
    downloadCount++;
    
    // Connect download signals
    connect(download, &QWebEngineDownloadRequest::receivedBytesChanged,
            this, [this, download, itemWidget]() {
        auto it = downloadItems.find(download);
        if (it != downloadItems.end()) {
            it->second->updateProgress(download->receivedBytes(), download->totalBytes());
        }
    });
    
    connect(download, &QWebEngineDownloadRequest::isFinishedChanged,
            this, [this, download, itemWidget]() {
        if (download->isFinished()) {
            auto it = downloadItems.find(download);
            if (it != downloadItems.end()) {
                it->second->setCompleted();
                onDownloadFinished();
            }
        }
    });
    
    // Connect cancel button
    connect(itemWidget->findChild<QPushButton*>("cancelButton"), 
            &QPushButton::clicked, download, &QWebEngineDownloadRequest::cancel);
    
    // Connect open button
    connect(itemWidget->findChild<QPushButton*>("openButton"),
            &QPushButton::clicked, this, [fileName]() {
        QFileInfo fileInfo(fileName);
        if (fileInfo.exists()) {
            QDesktopServices::openUrl(QUrl::fromLocalFile(fileName));
        }
    });
    
    show();
    raise();
    activateWindow();
}

void DownloadManager::show()
{
    QDialog::show();
}

int DownloadManager::activeDownloads() const
{
    return downloadCount;
}

void DownloadManager::onDownloadProgress(qint64 receivedBytes, qint64 totalBytes)
{
    Q_UNUSED(receivedBytes);
    Q_UNUSED(totalBytes);
    // Handled by individual download items
}

void DownloadManager::onDownloadFinished()
{
    // Could emit signal or update status
}

void DownloadManager::onDownloadCancelled()
{
    // Handle cancellation
}

void DownloadManager::cleanupFinishedDownloads()
{
    // Remove completed downloads older than a certain time
    // This is a simplified version
    auto it = downloadItems.begin();
    while (it != downloadItems.end()) {
        if (it->second && it->second->findChild<QProgressBar*>()->value() == 100) {
            // Could remove old completed downloads here
            ++it;
        } else {
            ++it;
        }
    }
}
