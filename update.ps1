# Check for uncommitted or unpushed changes
$uncommitted = git status --porcelain
$status = git status -sb 2>$null
$unpushed = $status -match "ahead \d+"

$warningMessage = ""
if ($uncommitted) {
    $warningMessage += "You have uncommitted changes in your local repository."
}
if ($unpushed) {
    if ($warningMessage) { $warningMessage += "`n" }
    $warningMessage += "You have unpushed commits in your local repository."
}

if ($warningMessage) {
    Write-Warning $warningMessage
    $continue = Read-Host "Do you want to continue anyway? (y/n)"
    if ($continue -notmatch "^y(es)?`$") {
        Write-Output "Update aborted."
        exit 0
    }
}

# Update the local repository, install dependencies and build the project
ssh jonathan@moodle "cd /var/www/moodle/mod/hypervideo && git pull && npm install && npm run build"