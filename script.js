class TFUKParser {
    constructor() {
        this.orders = [];
        this.fileContent = '';
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        var fileInput = document.getElementById('fileInput');
        var hideValidToggle = document.getElementById('hideValidToggle');
        var copyInvalidBtn = document.getElementById('copyInvalidBtn');

        // File input change - auto parse
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        }.bind(this));

        hideValidToggle.addEventListener('change', function() {
            this.filterOrders();
        }.bind(this));

        copyInvalidBtn.addEventListener('click', function() {
            this.copyInvalidOrders();
        }.bind(this));
    }

    handleFile(file) {
        if (!file.name.toLowerCase().endsWith('.txt')) {
            this.showToast('Please select a .txt file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.fileContent = e.target.result;
            this.parseFile();
        };
        reader.readAsText(file);
    }

    parseFile() {
        try {
            const lines = this.fileContent.split('\n');
            this.orders = [];
            
            // Reset the toggle to show all orders when new file is loaded
            document.getElementById('hideValidToggle').checked = false;
            
            let currentOrder = null;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].replace('\r', '');
                
                if (line.startsWith('$HDR') || line.startsWith('$EOF')) {
                    continue;
                }
                
                if (line.startsWith('H1')) {
                    if (currentOrder) {
                        this.orders.push(currentOrder);
                    }
                    currentOrder = this.parseH1Record(line);
                } else if (line.startsWith('H2') && currentOrder) {
                    this.parseH2Record(line, currentOrder);
                } else if (line.startsWith('H3') && currentOrder) {
                    this.parseH3Record(line, currentOrder);
                } else if (line.startsWith('D1') && currentOrder) {
                    this.parseD1Record(line, currentOrder);
                }
            }
            
            if (currentOrder) {
                this.orders.push(currentOrder);
            }
            
            this.validateOrders();
            this.displayOrders();
            this.updateStatistics();
            this.showSections();
            
        } catch (error) {
            this.showToast('Error parsing file: ' + error.message, 'error');
            console.error('Parse error:', error);
        }
    }

    parseH1Record(line) {
        return {
            recordType: 'H1',
            orderNumber: line.substring(2, 17).trim(),
            date: line.substring(17, 25).trim(),
            currencyFlag: line.substring(47, 48).trim(),
            reference: line.substring(48, 76).trim(),
            type: line.substring(76, 84).trim(),
            status: line.substring(84, 85).trim(),
            pdfFilename: line.substring(190, 230).trim(),
            currency: line.substring(230, 240).trim(),
            customers: [],
            paymentTerms: '',
            lineItems: [],
            validationErrors: [],
            validationWarnings: []
        };
    }

    parseH2Record(line, order) {
        const customer = {
            recordType: 'H2',
            customerCode: line.substring(17, 35).trim(),
            customerName: line.substring(35, 85).trim(),
            addressLine1: line.substring(85, 135).trim(),
            addressLine2: line.substring(135, 185).trim(),
            addressLine3: line.substring(185, 235).trim(),
            email: line.substring(235, 285).trim(),
            city: line.substring(285, 320).trim(),
            postalCode: line.substring(320, 330).trim(),
            countryPhone: line.substring(330, 359).trim()
        };
        order.customers.push(customer);
    }

    parseH3Record(line, order) {
        order.paymentTerms = line.substring(17, 20).trim();
    }

    parseD1Record(line, order) {
        const quantityBlock = line.substring(71, 99);
        const quantity = parseInt(quantityBlock.substring(4, 8)) || 1;
        const priceStr = line.substring(175, 187).trim();
        const price = parseInt(priceStr) || 0;
        
        const lineItem = {
            recordType: 'D1',
            itemReference: line.substring(17, 35).trim(),
            lineNumber: line.substring(35, 43).trim(),
            quantity: quantity,
            price: price,
            priceFormatted: (price / 100).toFixed(2),
            isbn: line.substring(226, 239).trim()
        };
        order.lineItems.push(lineItem);
    }

    validateOrders() {
        this.orders.forEach(order => {
            this.validateOrder(order);
        });
    }

    validateOrder(order) {
        order.validationErrors = [];
        order.validationWarnings = [];

        // Validate order header
        if (!order.orderNumber) {
            order.validationErrors.push('Missing order number');
        }
        if (!order.date || !/^\d{8}$/.test(order.date)) {
            order.validationErrors.push('Invalid or missing date format');
        }
        if (!order.currency) {
            order.validationWarnings.push('Missing currency');
        }

        // Validate customers
        if (order.customers.length === 0) {
            order.validationErrors.push('No customer information found');
        } else {
            order.customers.forEach((customer, index) => {
                // Check if this is an Amazon order by looking at customer name
                var isAmazonOrder = customer.customerName.toLowerCase().includes('amazon');
                
                // Check if this is a carrier customer (CS prefix)
                var isCarrierCustomer = customer.customerCode.startsWith('CS');
                
                if (!customer.customerName.trim()) {
                    order.validationErrors.push(`Customer ${index + 1}: Missing customer name`);
                }
                if (!customer.addressLine1.trim()) {
                    order.validationErrors.push(`Customer ${index + 1}: Missing address`);
                }
                if (!customer.city.trim()) {
                    order.validationErrors.push(`Customer ${index + 1}: Missing city`);
                }
                if (!customer.postalCode.trim()) {
                    order.validationWarnings.push(`Customer ${index + 1}: Missing postal code`);
                }
                
                // Skip email validation for Amazon orders and carrier customers
                if (!isAmazonOrder && !isCarrierCustomer) {
                    if (!customer.email.trim()) {
                        order.validationWarnings.push(`Customer ${index + 1}: Missing email`);
                    } else if (!this.isValidEmail(customer.email)) {
                        order.validationErrors.push(`Customer ${index + 1}: Invalid email format`);
                    }
                }
                
                if (!customer.countryPhone.trim()) {
                    order.validationWarnings.push(`Customer ${index + 1}: Missing phone`);
                }
            });
        }

        // Validate line items
        if (order.lineItems.length === 0) {
            order.validationErrors.push('No line items found');
        } else {
            order.lineItems.forEach((item, index) => {
                if (!item.isbn || !/^97[89]\d{10}$/.test(item.isbn)) {
                    order.validationErrors.push(`Line ${index + 1}: Invalid or missing ISBN`);
                }
                if (!item.quantity || item.quantity <= 0) {
                    order.validationErrors.push(`Line ${index + 1}: Invalid quantity`);
                }
                if (!item.price || item.price <= 0) {
                    order.validationErrors.push(`Line ${index + 1}: Invalid price`);
                }
                if (!item.itemReference.trim()) {
                    order.validationWarnings.push(`Line ${index + 1}: Missing item reference`);
                }
            });
        }

        // Set validation status
        if (order.validationErrors.length > 0) {
            order.validationStatus = 'error';
        } else if (order.validationWarnings.length > 0) {
            order.validationStatus = 'warning';
        } else {
            order.validationStatus = 'success';
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    displayOrders() {
        const container = document.getElementById('ordersContainer');
        container.innerHTML = '';

        this.orders.forEach((order, index) => {
            const orderCard = this.createOrderCard(order, index);
            container.appendChild(orderCard);
        });
    }

    createOrderCard(order, index) {
        const card = document.createElement('div');
        card.className = `order-card validation-${order.validationStatus}`;
        card.setAttribute('data-validation-status', order.validationStatus);

        const statusIcon = {
            'success': 'fas fa-check-circle text-success',
            'warning': 'fas fa-exclamation-triangle text-warning',
            'error': 'fas fa-times-circle text-danger'
        }[order.validationStatus];

        const statusText = {
            'success': 'Valid',
            'warning': 'Warnings',
            'error': 'Invalid'
        }[order.validationStatus];

        card.innerHTML = `
            <div class="order-header">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">
                            <i class="${statusIcon} me-2"></i>
                            Order #${order.orderNumber}
                            <span class="badge bg-secondary ms-2">${statusText}</span>
                        </h5>
                        <p class="mb-0 text-muted">
                            Date: ${this.formatDate(order.date)} | 
                            Currency: ${order.currency} |
                            Items: ${order.lineItems.length}
                        </p>
                    </div>
                    <button class="btn btn-outline-secondary btn-sm copy-btn" 
                            onclick="parser.copyOrderDetails(${index})" 
                            title="Copy order details">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                ${this.renderValidationMessages(order)}
                ${this.renderCustomers(order)}
                ${this.renderLineItems(order)}
            </div>
        `;

        return card;
    }

    renderValidationMessages(order) {
        if (order.validationErrors.length === 0 && order.validationWarnings.length === 0) {
            return '';
        }

        let html = '<div class="mb-3">';
        
        if (order.validationErrors.length > 0) {
            html += '<div class="alert alert-danger mb-2">';
            html += '<strong><i class="fas fa-times-circle me-2"></i>Errors:</strong><ul class="mb-0 mt-1">';
            order.validationErrors.forEach(error => {
                html += `<li>${error}</li>`;
            });
            html += '</ul></div>';
        }

        if (order.validationWarnings.length > 0) {
            html += '<div class="alert alert-warning mb-2">';
            html += '<strong><i class="fas fa-exclamation-triangle me-2"></i>Warnings:</strong><ul class="mb-0 mt-1">';
            order.validationWarnings.forEach(warning => {
                html += `<li>${warning}</li>`;
            });
            html += '</ul></div>';
        }

        html += '</div>';
        return html;
    }

    renderCustomers(order) {
        if (order.customers.length === 0) {
            return '<div class="alert alert-danger">No customer information available</div>';
        }

        let html = '<div class="row mb-3">';
        
        order.customers.forEach((customer, index) => {
            const isShippingCustomer = customer.customerCode.startsWith('ST');
            const customerType = isShippingCustomer ? 'Ship To' : 'Carrier';
            
            html += `
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="fas fa-${isShippingCustomer ? 'truck' : 'shipping-fast'} me-2"></i>
                                ${customerType} Customer
                            </h6>
                        </div>
                        <div class="card-body">
                            <p class="mb-1"><strong>${customer.customerName}</strong></p>
                            <p class="mb-1 text-muted">${customer.customerCode}</p>
                            ${customer.addressLine1 ? `<p class="mb-1">${customer.addressLine1}</p>` : ''}
                            ${customer.addressLine2 ? `<p class="mb-1">${customer.addressLine2}</p>` : ''}
                            ${customer.addressLine3 ? `<p class="mb-1">${customer.addressLine3}</p>` : ''}
                            <p class="mb-1">${customer.city} ${customer.postalCode}</p>
                            ${customer.email ? `<p class="mb-1"><i class="fas fa-envelope me-2"></i>${customer.email}</p>` : ''}
                            ${customer.countryPhone ? `<p class="mb-0"><i class="fas fa-phone me-2"></i>${customer.countryPhone}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    renderLineItems(order) {
        if (order.lineItems.length === 0) {
            return '<div class="alert alert-danger">No line items found</div>';
        }

        let html = '<div class="mb-3"><h6><i class="fas fa-list me-2"></i>Line Items</h6>';
        html += '<div class="table-responsive"><table class="table table-sm">';
        html += '<thead><tr><th>Line</th><th>ISBN</th><th>Reference</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>';

        let orderTotal = 0;
        order.lineItems.forEach((item, index) => {
            const total = item.quantity * item.price;
            orderTotal += total;
            
            html += `
                <tr>
                    <td>${item.lineNumber || (index + 1)}</td>
                    <td><code>${item.isbn}</code></td>
                    <td>${item.itemReference}</td>
                    <td>${item.quantity}</td>
                    <td>£${item.priceFormatted}</td>
                    <td>£${(total / 100).toFixed(2)}</td>
                </tr>
            `;
        });

        html += `</tbody><tfoot><tr><th colspan="5">Total</th><th>£${(orderTotal / 100).toFixed(2)}</th></tr></tfoot></table></div></div>`;
        return html;
    }

    formatDate(dateStr) {
        if (!dateStr || dateStr.length !== 8) return dateStr;
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return `${day}/${month}/${year}`;
    }

    updateStatistics() {
        const total = this.orders.length;
        const valid = this.orders.filter(o => o.validationStatus === 'success').length;
        const warning = this.orders.filter(o => o.validationStatus === 'warning').length;
        const invalid = this.orders.filter(o => o.validationStatus === 'error').length;

        document.getElementById('totalOrders').textContent = total;
        document.getElementById('validOrders').textContent = valid;
        document.getElementById('warningOrders').textContent = warning;
        document.getElementById('invalidOrders').textContent = invalid;

        // Show copy button if there are invalid orders
        const copyBtn = document.getElementById('copyInvalidBtn');
        if (invalid > 0) {
            copyBtn.style.display = 'inline-block';
        } else {
            copyBtn.style.display = 'none';
        }
    }

    filterOrders() {
        const hideValid = document.getElementById('hideValidToggle').checked;
        const orderCards = document.querySelectorAll('.order-card');
        
        orderCards.forEach(card => {
            const status = card.getAttribute('data-validation-status');
            if (hideValid && status === 'success') {
                card.classList.add('hidden');
            } else {
                card.classList.remove('hidden');
            }
        });
    }

    copyOrderDetails(index) {
        const order = this.orders[index];
        let details = `Order #${order.orderNumber}\n`;
        details += `Date: ${this.formatDate(order.date)}\n`;
        details += `Currency: ${order.currency}\n`;
        details += `Payment Terms: ${order.paymentTerms}\n\n`;

        order.customers.forEach((customer, i) => {
            details += `Customer ${i + 1}:\n`;
            details += `Name: ${customer.customerName}\n`;
            details += `Code: ${customer.customerCode}\n`;
            details += `Address: ${customer.addressLine1}\n`;
            if (customer.addressLine2) details += `         ${customer.addressLine2}\n`;
            if (customer.addressLine3) details += `         ${customer.addressLine3}\n`;
            details += `City: ${customer.city}\n`;
            details += `Postal Code: ${customer.postalCode}\n`;
            details += `Email: ${customer.email}\n`;
            details += `Phone: ${customer.countryPhone}\n\n`;
        });

        if (order.validationErrors.length > 0) {
            details += 'ERRORS:\n';
            order.validationErrors.forEach(error => details += `- ${error}\n`);
            details += '\n';
        }

        if (order.validationWarnings.length > 0) {
            details += 'WARNINGS:\n';
            order.validationWarnings.forEach(warning => details += `- ${warning}\n`);
            details += '\n';
        }

        navigator.clipboard.writeText(details).then(() => {
            this.showToast('Order details copied to clipboard', 'success');
        }).catch(() => {
            this.showToast('Failed to copy to clipboard', 'error');
        });
    }

    copyInvalidOrders() {
        const invalidOrders = this.orders.filter(o => o.validationStatus === 'error');
        if (invalidOrders.length === 0) {
            this.showToast('No invalid orders to copy', 'warning');
            return;
        }

        let details = `INVALID ORDERS REPORT\nGenerated: ${new Date().toLocaleString()}\n\n`;
        
        invalidOrders.forEach((order, index) => {
            details += `${index + 1}. Order #${order.orderNumber}\n`;
            details += `   Date: ${this.formatDate(order.date)}\n`;
            details += `   Customer: ${order.customers[0]?.customerName || 'Unknown'}\n`;
            details += `   Errors:\n`;
            order.validationErrors.forEach(error => details += `   - ${error}\n`);
            details += '\n';
        });

        navigator.clipboard.writeText(details).then(() => {
            this.showToast(`${invalidOrders.length} invalid orders copied to clipboard`, 'success');
        }).catch(() => {
            this.showToast('Failed to copy to clipboard', 'error');
        });
    }

    showSections() {
        document.getElementById('controlsSection').style.display = 'block';
        document.getElementById('statsSection').style.display = 'block';
        document.getElementById('ordersSection').style.display = 'block';
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        
        const bgClass = {
            'success': 'bg-success',
            'error': 'bg-danger',
            'warning': 'bg-warning',
            'info': 'bg-info'
        }[type] || 'bg-info';
        
        const icon = {
            'success': 'fa-check-circle',
            'error': 'fa-times-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        }[type] || 'fa-info-circle';

        toast.className = `toast show align-items-center text-white ${bgClass} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${icon} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);

        // Initialize Bootstrap toast
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }
}

// Initialize the parser
const parser = new TFUKParser();