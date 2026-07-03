#ifndef BROWSER_H
#define BROWSER_H

#include <QMainWindow>
#include <QWebEngineView>
#include <QStackedWidget>
#include <QTabWidget>
#include <QToolBar>
#include <QLineEdit>
#include <QPushButton>
#include <QProgressBar>
#include <QLabel>
#include <QMenu>
#include <QMenuBar>
#include <QStatusBar>
#include <QSplitter>
#include <QListWidget>
#include <QWebEngineDownloadRequest>
#include <QWebEngineProfile>
#include <QWebEnginePage>
#include <memory>

class TabWidget;
class AddressBar;
class DownloadManager;

class Browser : public QMainWindow
{
    Q_OBJECT

public:
    explicit Browser(QWidget *parent = nullptr);
    ~Browser();

private slots:
    void navigateToUrl(const QUrl &url);
    void updateAddressBar(const QUrl &url);
    void updateLoadingProgress(int progress);
    void updateTitle(const QString &title);
    void createNewTab();
    void closeCurrentTab();
    void refreshCurrentTab();
    void goBack();
    void goForward();
    void toggleFullScreen();
    void showBookmarks();
    void showHistory();
    void showDownloads();
    void openFile();
    void aboutBrowser();
    void onDownloadRequested(QWebEngineDownloadRequest *download);

private:
    void setupUI();
    void setupMenuBar();
    void setupToolBar();
    void setupStatusBar();
    void setupConnections();
    void loadStyleSheet();

    TabWidget *tabWidget;
    AddressBar *addressBar;
    QToolBar *mainToolBar;
    QProgressBar *loadingProgress;
    QLabel *statusLabel;
    DownloadManager *downloadManager;
    
    QMenu *fileMenu;
    QMenu *editMenu;
    QMenu *viewMenu;
    QMenu *helpMenu;
    
    QAction *newTabAction;
    QAction *closeTabAction;
    QAction *openFileAction;
    QAction *exitAction;
    QAction *backAction;
    QAction *forwardAction;
    QAction *refreshAction;
    QAction *fullScreenAction;
    QAction *bookmarksAction;
    QAction *historyAction;
    QAction *downloadsAction;
    QAction *aboutAction;
};

#endif // BROWSER_H
