const { exec } = require('child_process')

exec('hexo s -d', (err, stdout, stderr) => {
    if(err) {
        console.log(err);
        return;
    }
    
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
});