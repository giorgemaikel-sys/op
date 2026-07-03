#include "addressbar.h"
#include <QFont>
#include <QStyle>
#include <QApplication>

AddressBar::AddressBar(QWidget *parent) 
    : QWidget(parent), isLoading(false)
{
    setupUI();
}

AddressBar::~AddressBar()
{
}

void AddressBar::setupUI()
{
    layout = new QHBoxLayout(this);
    layout->setContentsMargins(5, 5, 5, 5);
    layout->setSpacing(5);
    
    // Home button
    homeButton = new QPushButton("🏠");
    homeButton->setFixedSize(32, 32);
    homeButton->setToolTip("Home");
    homeButton->setStyleSheet(
        "QPushButton {"
        "    background-color: #f0f0f0;"
        "    border: 1px solid #ccc;"
        "    border-radius: 16px;"
        "    font-size: 16px;"
        "}"
        "QPushButton:hover {"
        "    background-color: #e0e0e0;"
        "    border-color: #999;"
        "}"
    );
    
    // URL input field
    urlInput = new QLineEdit();
    urlInput->setPlaceholderText("Enter URL or search...");
    urlInput->setFont(QFont("Segoe UI", 11));
    urlInput->setClearButtonEnabled(true);
    urlInput->setStyleSheet(
        "QLineEdit {"
        "    padding: 8px 12px;"
        "    border: 1px solid #ccc;"
        "    border-radius: 20px;"
        "    background-color: white;"
        "    selection-background-color: #0078d4;"
        "}"
        "QLineEdit:focus {"
        "    border: 2px solid #0078d4;"
        "}"
        "QLineEdit:hover {"
        "    border-color: #999;"
        "}"
    );
    
    // Setup completer for URL suggestions
    completerModel = new QStringListModel(this);
    completer = new QCompleter(completerModel, this);
    completer->setCaseSensitivity(Qt::CaseInsensitive);
    completer->setMaxVisibleItems(10);
    urlInput->setCompleter(completer);
    
    // Refresh button
    refreshButton = new QPushButton("⟳");
    refreshButton->setFixedSize(32, 32);
    refreshButton->setToolTip("Refresh");
    refreshButton->setStyleSheet(
        "QPushButton {"
        "    background-color: #f0f0f0;"
        "    border: 1px solid #ccc;"
        "    border-radius: 16px;"
        "    font-size: 18px;"
        "}"
        "QPushButton:hover {"
        "    background-color: #e0e0e0;"
        "    border-color: #999;"
        "}"
    );
    
    // Go button
    goButton = new QPushButton("➜");
    goButton->setFixedSize(32, 32);
    goButton->setToolTip("Go");
    goButton->setStyleSheet(
        "QPushButton {"
        "    background-color: #0078d4;"
        "    border: none;"
        "    border-radius: 16px;"
        "    color: white;"
        "    font-size: 16px;"
        "    font-weight: bold;"
        "}"
        "QPushButton:hover {"
        "    background-color: #005a9e;"
        "}"
        "QPushButton:pressed {"
        "    background-color: #004578;"
        "}"
    );
    
    // Add widgets to layout
    layout->addWidget(homeButton);
    layout->addWidget(urlInput, 1);
    layout->addWidget(refreshButton);
    layout->addWidget(goButton);
    
    // Set minimum height
    setMinimumHeight(50);
    
    // Connect signals
    connect(urlInput, &QLineEdit::returnPressed, this, &AddressBar::onReturnPressed);
    connect(urlInput, &QLineEdit::textChanged, this, &AddressBar::onTextChanged);
    connect(goButton, &QPushButton::clicked, this, &AddressBar::onGoButtonClicked);
    connect(refreshButton, &QPushButton::clicked, this, &AddressBar::onRefreshButtonClicked);
    connect(homeButton, &QPushButton::clicked, this, &AddressBar::onHomeButtonClicked);
}

void AddressBar::setUrl(const QUrl &url)
{
    if (url.isValid()) {
        urlInput->blockSignals(true);
        urlInput->setText(url.toString());
        urlInput->blockSignals(false);
    }
}

QUrl AddressBar::currentUrl() const
{
    return QUrl::fromUserInput(urlInput->text());
}

void AddressBar::setLoading(bool loading)
{
    isLoading = loading;
    if (loading) {
        refreshButton->setText("✕");
        refreshButton->setToolTip("Stop");
    } else {
        refreshButton->setText("⟳");
        refreshButton->setToolTip("Refresh");
    }
}

void AddressBar::addHistoryEntry(const QString &url)
{
    if (!historyList.contains(url)) {
        historyList.prepend(url);
        if (historyList.size() > 100) {
            historyList.removeLast();
        }
        updateCompleter();
    }
}

void AddressBar::clearFocus()
{
    urlInput->clearFocus();
}

void AddressBar::updateCompleter()
{
    completerModel->setStringList(historyList);
}

QString AddressBar::ensureUrlFormat(const QString &text)
{
    QString url = text.trimmed();
    
    if (url.isEmpty()) {
        return QString();
    }
    
    // Check if it's already a valid URL with scheme
    if (url.startsWith("http://", Qt::CaseInsensitive) ||
        url.startsWith("https://", Qt::CaseInsensitive) ||
        url.startsWith("file://", Qt::CaseInsensitive) ||
        url.startsWith("about:", Qt::CaseInsensitive) ||
        url.startsWith("chrome:", Qt::CaseInsensitive)) {
        return url;
    }
    
    // Check if it looks like an email address
    if (url.contains("@") && !url.contains(" ")) {
        return "mailto:" + url;
    }
    
    // Check if it looks like a domain name or IP address
    if (url.contains(".") || url.contains(":")) {
        return "https://" + url;
    }
    
    // Otherwise, treat as search query (you could integrate with a search engine here)
    return "https://www.google.com/search?q=" + QUrl::toPercentEncoding(url);
}

void AddressBar::onReturnPressed()
{
    onGoButtonClicked();
}

void AddressBar::onTextChanged(const QString &text)
{
    // Could implement live search suggestions here
    Q_UNUSED(text);
}

void AddressBar::onGoButtonClicked()
{
    QString text = urlInput->text().trimmed();
    if (!text.isEmpty()) {
        QString formattedUrl = ensureUrlFormat(text);
        QUrl url(formattedUrl);
        if (url.isValid()) {
            addHistoryEntry(text);
            emit urlSubmitted(url);
        }
    }
}

void AddressBar::onRefreshButtonClicked()
{
    if (isLoading) {
        // Stop loading - this would be handled by the browser
        emit refreshRequested();
    } else {
        // Refresh current page
        emit refreshRequested();
    }
}

void AddressBar::onHomeButtonClicked()
{
    emit homeRequested();
}
