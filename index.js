const http = require('http');
const fs = require('fs');

// Send back index.html file
const sendWebPage = (response) => {
    try {
        const buffer = fs.readFileSync('index.html');

        response.writeHead(200);
        response.end(buffer);
    } catch (error) {
        console.error(error);

        response.writeHead(404);
        response.end();
    }
};

// Send back a JSON response
const sendJsonResponse = (data, status, response) => {
    try {
        response.writeHead(status, { 'Content-Type': 'application/json' });
        response.write(JSON.stringify(data));
        response.end();
    } catch (error) {
        console.error(error);
        response.writeHead(500);
        response.end();
    }
};

const serveForm = (bodyBuffer, response) => {
    try {
        const body = JSON.parse(bodyBuffer);

        const data = {
            form: [
                {
                    key: 'customerName',
                    name: 'Customer Name',
                    type: 'text',
                },
                {
                    key: 'isHappy',
                    name: 'Are you happy?',
                    type: 'select',
                    values: [
                        {
                            key: 'yes',
                            name: 'Yes',
                        },
                        {
                            key: 'no',
                            name: 'No'
                        },
                    ],
                },
            ],
        };

        if (body.isHappy === 'yes') {
            data.form.push({
                key: 'reason',
                name: 'Why are you happy?',
                type: 'text',
            });
        }

        if (body.isHappy === 'no') {
            data.form.push({
                key: 'reason',
                name: 'Why are you not happy?',
                type: 'text',
            });
        }
        
        sendJsonResponse(data, 200, response);
    } catch (error) {
        console.error(error);
        response.writeHead(500);
        response.end();
    }
};

const serveSubmit = (bodyBuffer, response) => {
    try {
        const body = JSON.parse(bodyBuffer);
        const { customerName, isHappy, reason } = body;

        // Validate form (missing)
        const missingFields = [];
        if (customerName == null || customerName === '') {
            missingFields.push('customerName');
        }
        if (isHappy == null || isHappy === '') {
            missingFields.push('isHappy');
        }
        if (reason == null || reason === '') {
            missingFields.push('reason');
        }
        if (missingFields.length > 0) {
            sendJsonResponse({ 
                error: 'missing fields', 
                fields: missingFields 
            }, 400, response);
            return;
        }

        // Validate form (value)
        if (isHappy !== 'yes' && isHappy !== 'no') {
            sendJsonResponse({ 
                error: 'invalid value', 
                field: 'isHappy', 
                expected: ['yes', 'no'], 
                actual: isHappy
            }, 400, response);
            return;
        }

        // Print and Log
        console.log(`Customer Name: ${customerName || 'NULL'}`)
        console.log(`Is Happy: ${isHappy || 'NULL'}`)
        console.log(`Reason: ${reason || 'NULL'}`)
        console.log('---');
        

        sendJsonResponse(body, 200, response);
    } catch (error) {
        console.error(error);
        response.writeHead(500);
        response.end();
    }
};


// Creating Server
const server = http.createServer((request, response) => {
    const { url } = request;

    // Read data
    const buffer = [];
    request.on('data', chunk => buffer.push(chunk));

    // Handle Error
    request.on('error', (error) => {
        console.error(error);
        response.writeHead(500);
        response.end();
    });

    // Handle Request
    request.on('end', () => {
        const bodyBuffer = Buffer.concat(buffer);

        // Handle different routes
        if (url === '/form') {
            // Get or Refresh Form
            serveForm(bodyBuffer, response);
        } else if (url === '/submit') {
            // Submit Form
            serveSubmit(bodyBuffer, response);
        } else {
            // Web Page
            sendWebPage(response);
        }
    });
});


server.listen(8080, '0.0.0.0', () => console.log(`Server is running`));
