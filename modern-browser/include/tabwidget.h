#ifndef TABWIDGET_H
#define TABWIDGET_H

#include <QTabWidget>
#include <QWebEngineView>
#include <QWebEnginePage>
#include <QStackedWidget>
#include <vector>
#include <memory>

class TabWidget : public QTabWidget
{
    Q_OBJECT

public:
    explicit TabWidget(QWidget *parent = nullptr);
    ~TabWidget();

    QWebEngineView* currentWebView() const;
    QWebEngineView* createNewTab(const QUrl &url = QUrl());
    void closeTab(int index);
    int getTabIndex(QWebEngineView *view) const;

signals:
    void urlChanged(const QUrl &url);
    void loadingProgress(int progress);
    void titleChanged(const QString &title);
    void downloadRequested(QWebEngineDownloadRequest *download);
    void allTabsClosed();

private slots:
    void onCurrentTabChanged(int index);
    void onTabTitleChanged(const QString &title);
    void onTabUrlChanged(const QUrl &url);
    void onLoadingProgress(int progress);
    void closeTabButtonClicked();

private:
    struct TabInfo {
        QWebEngineView *webView;
        QWidget *container;
        QPushButton *closeButton;
        
        TabInfo() : webView(nullptr), container(nullptr), closeButton(nullptr) {}
    };

    std::vector<TabInfo> tabs;
    void updateTabCloseButtons();
};

#endif // TABWIDGET_H
