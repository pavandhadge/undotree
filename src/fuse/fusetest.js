const Fuse = require('fuse.js');

// Function to search through provided content
function searchContent(contentArray, query) {
    const options = {
        includeScore: true,
        keys: ['content'] // We are searching in the 'content' field
    };

    const fuse = new Fuse(contentArray, options);
    return fuse.search(query);
}

// Example usage
const query = 'printf("hello");'; // Replace this with your search term
const codeFiles = [
    { fileName: 'file1.js', content: 'function example() { console.log("Hello, world!"); }' },
    { fileName: 'file2.py', content: 'def example(): print("Hello, world!")' },
    { fileName: 'file3.java', content: 'public class Example { public static void main(String[] args) { System.out.println("Hello, world!"); } }' }
];

const results = searchContent(codeFiles, query);

// Output the results
results.forEach(result => {
    console.log(`File: ${result.item.fileName}, Score: ${result.score}`);
    console.log(`Content: ${result.item.content}`);
    console.log('-------------------------');
});
