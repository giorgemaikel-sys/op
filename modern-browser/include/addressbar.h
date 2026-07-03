#ifndef ADDRESSBAR_H
#define ADDRESSBAR_H

#include <QWidget>
#include <QLineEdit>
#include <QPushButton>
#include <QHBoxLayout>
#include <QUrl>
#include <QCompleter>
#include <QStringListModel>

class AddressBar : public QWidget
{
    Q_OBJECT

public:
    explicit AddressBar(QWidget *parent = nullptr);
    ~AddressBar();

    void setUrl(const QUrl &url);
    QUrl currentUrl() const;
    void setLoading(bool loading);
    void addHistoryEntry(const QString &url);
    void clearFocus();

signals:
    void urlSubmitted(const QUrl &url);
    void refreshRequested();
    void homeRequested();

private slots:
    void onReturnPressed();
    void onTextChanged(const QString &text);
    void onGoButtonClicked();
    void onRefreshButtonClicked();
    void onHomeButtonClicked();

private:
    void setupUI();
    void updateCompleter();
    QString ensureUrlFormat(const QString &text);

    QLineEdit *urlInput;
    QPushButton *goButton;
    QPushButton *refreshButton;
    QPushButton *homeButton;
    QHBoxLayout *layout;
    
    QStringListModel *completerModel;
    QCompleter *completer;
    QStringList historyList;
    
    bool isLoading;
};

#endif // ADDRESSBAR_H
