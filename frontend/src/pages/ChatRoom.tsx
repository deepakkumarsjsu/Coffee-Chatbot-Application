import React, { useEffect, useState, useRef } from 'react';
import MessageList from '../components/MessageList';
import { MessageInterface, Product } from '../types/types';
import { FiSend, FiMic, FiMicOff } from 'react-icons/fi';
import { callChatBotAPI } from '../services/chatBot';
import toast from 'react-hot-toast';
import chatbotImage from '../../assets/unnamed.jpg';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchProducts } from '../services/productsService';
import { extractOrderFromMemory, matchOrderItemToProduct, isOrderCompletion, OrderItem } from '../utils/orderExtractor';
import { ref, push } from 'firebase/database';
import { database } from '../config/firebase';
import PaymentModal from '../components/PaymentModal';

interface ChatRoomProps {
  isWidget?: boolean;
  isFullScreen?: boolean;
  messages: MessageInterface[];
  setMessages: React.Dispatch<React.SetStateAction<MessageInterface[]>>;
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  isSending: boolean;
  setIsSending: React.Dispatch<React.SetStateAction<boolean>>;
  onCloseChat?: () => void;
}

const ChatRoom = ({ 
  isWidget = false, 
  isFullScreen = false,
  messages,
  setMessages,
  isTyping,
  setIsTyping,
  inputValue,
  setInputValue,
  isSending,
  setIsSending,
  onCloseChat
}: ChatRoomProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [processedOrders, setProcessedOrders] = useState<Set<string>>(new Set());
  const { addToCart, cartItems, clearCart, getTotalPrice } = useCart();
  const { currentUser } = useAuth();
  const lastOrderHashRef = useRef<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Load products for order matching
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const fetchedProducts = await fetchProducts();
        setProducts(fetchedProducts);
      } catch (error) {
      }
    };
    loadProducts();
  }, []);

  // Place order function (now called after payment success)
  const handlePlaceOrder = async (): Promise<boolean> => {
    if (cartItems.length === 0) {
      return false;
    }

    try {
      const orderData = {
        userId: currentUser?.uid || 'anonymous',
        items: cartItems.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image || '',
        })),
        total: getTotalPrice(),
        status: 'preparing',
        createdAt: new Date().toISOString(),
        customerName: currentUser?.displayName || 'Guest',
        customerEmail: currentUser?.email || '',
        paymentStatus: 'paid',
      };

      const ordersRef = ref(database, 'orders');
      await push(ordersRef, orderData);

      clearCart(true); // Clear cart silently - success message shown in chat
      return true;
    } catch (error: any) {
      toast.error('Failed to place order. Please try again.');
      return false;
    }
  };

  // Handle payment success from chatbot flow
  const handlePaymentSuccess = async () => {
    const totalBeforeOrder = getTotalPrice();
    
    // Show loading/processing message first
    setIsTyping(true);
    
    const success = await handlePlaceOrder();
    setShowPaymentModal(false);
    
    if (success) {
      // Wait 2 seconds before showing success message (as requested)
      setTimeout(() => {
        setIsTyping(false);
        
      // Show success message in chat after payment
      const successMessages = [
        `Order placed successfully! Your order total is $${(totalBeforeOrder * 1.1).toFixed(2)}. Thank you for choosing Merry's Way Coffee Shop!`,
        `Perfect! Your order has been confirmed. Total: $${(totalBeforeOrder * 1.1).toFixed(2)}. We'll have it ready for you soon!`,
        `Great choice! Order confirmed for $${(totalBeforeOrder * 1.1).toFixed(2)}. Thanks for visiting Merry's Way Coffee Shop!`,
        `Your order is on the way! Total: $${(totalBeforeOrder * 1.1).toFixed(2)}. We appreciate your business!`,
        `Order successfully placed! Your total is $${(totalBeforeOrder * 1.1).toFixed(2)}. Thank you for choosing us!`,
      ];
      const randomMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
      const botResponse: MessageInterface = {
        role: 'assistant',
        content: randomMessage
      };
      setMessages(prev => [...prev, botResponse]);
        
      // Reset processed orders after placing order
      setProcessedOrders(new Set());
      lastOrderHashRef.current = '';
      
        // Close chat after showing success message (wait 5 seconds to let user read it)
      if (onCloseChat) {
        setTimeout(() => {
          onCloseChat();
          }, 5000);
      }
      }, 2000); // 2 seconds delay before showing success message
    } else {
      setIsTyping(false);
    }
  };

  // Process orders from API response memory
  const processOrdersFromMemory = (orderItems: OrderItem[], _fullResponse?: any) => {
    // Normalize order items for consistent hashing (ensure quantity defaults to 1)
    const normalizedItems = orderItems.map(item => ({
      item: item.item,
      price: item.price,
      quantity: item.quantity && item.quantity > 0 ? item.quantity : 1
    }));
    
    // Create a hash of the current order to detect changes
    const orderHash = JSON.stringify(normalizedItems);
    
    // Only process if this is a new/different order
    if (orderHash === lastOrderHashRef.current) {
      return; // Already processed this order
    }
    
    // Find new items that weren't in the previous order
    const previousOrderHash = lastOrderHashRef.current;
    let previousOrderItems: OrderItem[] = [];
    if (previousOrderHash) {
      try {
        previousOrderItems = JSON.parse(previousOrderHash);
      } catch (e) {
        // If we can't parse, treat as empty
      }
    }
    
    // Create a set of previous items for quick lookup
    // Normalize quantities (default to 1 if missing)
    const previousItemsSet = new Set(
      previousOrderItems.map(item => {
        const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
        return `${item.item.toLowerCase()}-${qty}`;
      })
    );
    
    // Find new items (items not in previous order)
    // Normalize quantities for comparison
    const newItems = orderItems.filter(item => {
      const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const itemKey = `${item.item.toLowerCase()}-${qty}`;
      return !previousItemsSet.has(itemKey);
    });
    
    lastOrderHashRef.current = orderHash;
    
    let addedCount = 0;
    let notFoundItems: string[] = [];

    // Only process new items
    for (const orderItem of newItems) {
      // Ensure quantity is valid (default to 1 if missing or invalid)
      const quantity = orderItem.quantity && orderItem.quantity > 0 ? orderItem.quantity : 1;
      
      const product = matchOrderItemToProduct(orderItem, products);
      if (product) {
        // Check if we've already added this exact item in this batch
        // Use product.id and quantity to create unique key
        const itemKey = `${product.id}-${quantity}`;
        
        // Also check if item is already in cart to prevent duplicates
        const isAlreadyInCart = cartItems.some(item => 
          item.product.id === product.id && item.quantity >= quantity
        );
        
        if (!processedOrders.has(itemKey) && !isAlreadyInCart) {
          // Use silent=true to suppress individual toasts, we'll show a combined one
          addToCart(product, quantity, true);
          setProcessedOrders(prev => new Set(prev).add(itemKey));
          addedCount++;
        }
      } else {
        notFoundItems.push(orderItem.item);
      }
    }

    if (addedCount > 0) {
      // Items added silently via chatbot - no toast message
      // The chatbot will handle user feedback through chat messages
    }

    // notFoundItems can be used for future error handling if needed
  };

  const handleVoiceTranscript = (transcript: string) => {
    // Paste the transcribed text into the input field for review before sending
    setInputValue(transcript);
  };

  const handleVoiceError = (error: string) => {
    toast.error(error);
  };

  const { isListening, isSupported, startListening, stopListening } = useVoiceRecognition({
    onTranscript: handleVoiceTranscript,
    onError: handleVoiceError,
  });

  const toggleVoiceRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Helper functions to detect and handle informational queries
  const isRecommendationQuery = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    const keywords = ['recommend', 'popular', 'best', 'favorite', 'suggest', 'what do you have', 'what\'s available', 'what can i get'];
    return keywords.some(keyword => lowerMessage.includes(keyword));
  };

  const isPriceQuery = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    const keywords = ['price', 'cost', 'how much', 'what does', 'what\'s the price', 'how much does', 'how much is'];
    return keywords.some(keyword => lowerMessage.includes(keyword));
  };

  const extractProductNameFromQuery = (message: string, products: Product[]): Product | null => {
    const lowerMessage = message.toLowerCase();
    // Try to find a product name in the message
    for (const product of products) {
      const productNameLower = product.name.toLowerCase();
      if (lowerMessage.includes(productNameLower)) {
        return product;
      }
    }
    return null;
  };

  const generateRecommendationResponse = (products: Product[]): string => {
    if (products.length === 0) {
      return "I'm sorry, I don't have product information available at the moment. Please check back later!";
    }

    // Get popular items (you can customize this logic)
    // For now, let's show top 5 items by price (assuming higher price = more premium/popular)
    const popularItems = [...products]
      .sort((a, b) => b.price - a.price)
      .slice(0, 5);

    // Create different format variations for the item list
    const format1 = popularItems.map((item, index) => {
      const description = item.description ? ` - ${item.description}` : '';
      return `${index + 1}. **${item.name}** - $${item.price.toFixed(2)}${description}`;
    }).join('\n\n');
    
    const format2 = popularItems.map((item) => {
      const description = item.description ? `\n   ${item.description}` : '';
      return `• **${item.name}** | $${item.price.toFixed(2)}${description}`;
    }).join('\n');
    
    const format3 = popularItems.map((item) => {
      const description = item.description ? ` (${item.description})` : '';
      return `→ ${item.name}${description} — $${item.price.toFixed(2)}`;
    }).join('\n');
    
    const format4 = popularItems.map((item) => {
      return `**${item.name}**\n   Price: $${item.price.toFixed(2)}${item.description ? `\n   ${item.description}` : ''}`;
    }).join('\n\n');
    
    const format5 = popularItems.map((item, index) => {
      return `[${index + 1}] ${item.name} — $${item.price.toFixed(2)}${item.description ? ` | ${item.description}` : ''}`;
    }).join('\n');

    const responses = [
      // 2-line messages
      `Here's what's hot right now:\n\n${format1}\n\nInterested in any of these?`,
      `Top picks from our menu:\n\n${format2}\n\nWhich one catches your eye?`,
      `Customer favorites:\n\n${format3}\n\nWant details on any of these?`,
      
      // 3-line messages
      `Our most popular items:\n\n${format4}\n\nCurious about any of them?\n\nFeel free to ask!`,
      `Best sellers:\n\n${format5}\n\nWhat would you like to know?\n\nI'm here to help.`,
      `🔥 Trending items:\n\n${format1}\n\nWhich one interests you?\n\nThey're all great choices!`,
      
      // 4-line messages
      `Here are some top recommendations:\n\n${format2}\n\nFeel free to ask me anything!\n\nI can give you more details on any item.\n\nWhat catches your eye?`,
      `Popular choices:\n\n${format3}\n\nWant to learn more?\n\nEach one has something special.\n\nWhich one sounds good to you?`,
      `Our regulars love these:\n\n${format4}\n\nWhat questions do you have?\n\nI'm happy to help you decide.\n\nJust let me know!`,
      
      // 5-line messages
      `Top-rated items:\n\n${format5}\n\nI can tell you more about any of them.\n\nThese are consistently our bestsellers.\n\nCustomers keep coming back for these.\n\nWhat would you like to know?`,
      `⭐ Customer favorites:\n\n${format1}\n\nWhich one sounds good?\n\nThey're all made with care.\n\nOur team takes pride in each one.\n\nWant to hear more about any?`,
      `Here's what people are ordering:\n\n${format2}\n\nInterested in any?\n\nThese are the ones that get rave reviews.\n\nPeople love the quality and taste.\n\nWhat would you like to try?`,
      `Most popular right now:\n\n${format3}\n\nWant more info?\n\nI can share details about ingredients.\n\nOr tell you about preparation methods.\n\nJust ask!`,
      `Best of the menu:\n\n${format4}\n\nWhat would you like to know?\n\nEach item is carefully crafted.\n\nWe use premium ingredients.\n\nWhich one interests you most?`,
      `Top sellers this week:\n\n${format5}\n\nCurious about any?\n\nThese have been flying off the shelves.\n\nOur customers can't get enough.\n\nWant to know why they're so popular?`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generatePriceResponse = (product: Product): string => {
    const description = product.description ? ` ${product.description}` : '';
    
    const responses = [
      // 2-line messages
      `💰 **${product.name}**: $${product.price.toFixed(2)}${description}\n\nAdd it to your cart?`,
      `→ ${product.name}: **$${product.price.toFixed(2)}**${description}\n\nAdd to cart?`,
      `$${product.price.toFixed(2)} — ${product.name}${description}\n\nShould I add it?`,
      `**${product.name}** = $${product.price.toFixed(2)}${description}\n\nAdd it?`,
      
      // 3-line messages
      `Price: **$${product.price.toFixed(2)}**${description}\n\nThat's for the ${product.name}.\n\nShould I add it?`,
      `**${product.name}**\n$${product.price.toFixed(2)}${description}\n\nWant me to add it?`,
      `**${product.name}**\nPrice: $${product.price.toFixed(2)}${description}\n\nAdd it?`,
      `$${product.price.toFixed(2)} for ${product.name}.${description}\n\nWant me to add it?\n\nIt's a great choice!`,
      
      // 4-line messages
      `That's $${product.price.toFixed(2)}.${description}\n\nThe ${product.name} is a great choice!\n\nIt's one of our popular items.\n\nAdd it to your cart?`,
      `Price: $${product.price.toFixed(2)}${description}\n\nThat's the ${product.name}.\n\nIt's really good!\n\nAdd it?`,
      `$${product.price.toFixed(2)} — ${product.name}${description}\n\nShould I add it to your cart?\n\nIt's a customer favorite.\n\nWant me to add it?`,
      `**${product.name}**: $${product.price.toFixed(2)}${description}\n\nAdd it?\n\nIt's definitely worth trying.\n\nShould I go ahead?`,
      
      // 5-line messages
      `$${product.price.toFixed(2)} for ${product.name}${description}\n\nWant me to add it?\n\nThis is one of our best sellers.\n\nCustomers love it!\n\nShould I add it to your cart?`,
      `**${product.name}**\n→ $${product.price.toFixed(2)}${description}\n\nAdd to cart?\n\nIt's made with premium ingredients.\n\nYou'll love it!\n\nWant me to add it?`,
      `That one's $${product.price.toFixed(2)}.${description}\n\nThe ${product.name} is excellent.\n\nIt's a quality choice.\n\nPeople keep coming back for it.\n\nAdd it?`,
      `$${product.price.toFixed(2)} — ${product.name}${description}\n\nShould I add it?\n\nThis item is really popular.\n\nIt's prepared fresh daily.\n\nWant me to add it to your order?`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async (messageText?: string) => {
    let message = (messageText || inputValue).trim();
    if (!message || isSending) return;
    
    // Check if user wants to complete the order
    if (isOrderCompletion(message)) {
      if (cartItems.length === 0) {
        toast.error('Your cart is empty. Please add items first.');
        return;
      }
      
      const userMessage: MessageInterface = { content: message, role: 'user' };
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsSending(true);
      
      // Show typing indicator
      setIsTyping(true);
      
      // Wait 10 seconds before showing payment modal to allow chatbot to respond
      setTimeout(() => {
        setShowPaymentModal(true);
        setIsSending(false);
        setIsTyping(false);
      }, 10000); // 10 seconds delay
      
      return;
    }
    
    try {
        setIsSending(true);
        // Add the user message to the list of messages
        let InputMessages = [...messages, { content: message, role: 'user' }];

        setMessages(InputMessages);
        setInputValue('');
        setIsTyping(true);
        
        const response = await callChatBotAPI(InputMessages);
        let resposnseMessage = response.message;
        const fullResponse = response.fullResponse;
        
        // Extract orders from API response memory
        const orderItems = fullResponse ? extractOrderFromMemory(fullResponse) : [];
        const hasOrders = orderItems && orderItems.length > 0;
        
        // Extract and process orders from API response memory BEFORE adding message
        if (fullResponse && hasOrders) {
          if (orderItems.length > 0) {
            
            // Check if there are new items to add (before processing)
            const previousOrderHash = lastOrderHashRef.current;
            let previousOrderItems: OrderItem[] = [];
            if (previousOrderHash) {
              try {
                previousOrderItems = JSON.parse(previousOrderHash);
              } catch (e) {
                // If we can't parse, treat as empty
              }
            }
            
            // Normalize quantities for comparison (default to 1 if missing)
            const previousItemsSet = new Set(
              previousOrderItems.map(item => {
                const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
                return `${item.item.toLowerCase()}-${qty}`;
              })
            );
            
            const newItems = orderItems.filter(item => {
              const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
              const itemKey = `${item.item.toLowerCase()}-${qty}`;
              return !previousItemsSet.has(itemKey);
            });
            
            // Check if any new items can be matched to products
            if (newItems.length > 0) {
              const matchedItems = newItems
                .map(item => {
                  const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
                  const product = matchOrderItemToProduct(item, products);
                  if (product) {
                    const itemKey = `${product.id}-${qty}`;
                    // Check if we haven't already processed this item
                    if (!processedOrders.has(itemKey)) {
                      return { item, product, name: product.name, quantity: qty };
                    }
                  }
                  return null;
                })
                .filter(Boolean) as Array<{ item: OrderItem; product: Product; name: string; quantity: number }>;
              
              // Process the orders (this will add them to cart)
              processOrdersFromMemory(orderItems, fullResponse);
              
              // If items were matched and content is empty, generate a positive response
              if (matchedItems.length > 0 && (!resposnseMessage.content || resposnseMessage.content.trim() === '')) {
                const itemNames = matchedItems.map(m => m.name);
                const itemText = itemNames.length === 1 
                  ? itemNames[0] 
                  : itemNames.slice(0, -1).join(', ') + ' and ' + itemNames[itemNames.length - 1];
                
                // Array of different message variations with follow-up questions
                const followUpQuestions = [
                  'Would you like to add anything else?',
                  'Is there anything else you\'d like to add?',
                  'Would you like to add more items?',
                  'Anything else you\'d like to order?',
                  'Can I help you with anything else?',
                  'Would you like to add something more?',
                  'Is there anything else I can add for you?',
                  'Would you like to add any other items?',
                ];
                
                const messageVariations = [
                  `Great! I've added ${itemText} to your cart. ${itemNames.length === 1 ? 'It' : 'They'} ${itemNames.length === 1 ? 'is' : 'are'} ready for checkout! ${followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)]}`,
                  `Perfect! ${itemText} ${itemNames.length === 1 ? 'has' : 'have'} been added to your cart. ${itemNames.length === 1 ? 'It' : 'They'} ${itemNames.length === 1 ? 'is' : 'are'} ready when you are! ${followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)]}`,
                  `Excellent choice! I've added ${itemText} to your cart. ${itemNames.length === 1 ? 'It' : 'They'} ${itemNames.length === 1 ? 'is' : 'are'} waiting for you! ${followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)]}`,
                  `Wonderful! ${itemText} ${itemNames.length === 1 ? 'is' : 'are'} now in your cart. Ready to proceed to checkout! ${followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)]}`,
                  `Awesome! I've placed ${itemText} in your cart. ${itemNames.length === 1 ? 'It' : 'They'} ${itemNames.length === 1 ? 'is' : 'are'} all set! ${followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)]}`,
                  `Perfect selection! ${itemText} ${itemNames.length === 1 ? 'has' : 'have'} been added. Your cart is ready! ${followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)]}`,
                  `Great pick! I've added ${itemText} to your cart. ${itemNames.length === 1 ? 'It' : 'They'} ${itemNames.length === 1 ? 'looks' : 'look'} delicious! ${followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)]}`,
                  `Fantastic! ${itemText} ${itemNames.length === 1 ? 'is' : 'are'} now in your cart. ${itemNames.length === 1 ? 'It' : 'They'} ${itemNames.length === 1 ? 'is' : 'are'} ready for checkout! ${followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)]}`,
                  `Lovely choice! I've added ${itemText} to your cart. ${itemNames.length === 1 ? 'It' : 'They'} ${itemNames.length === 1 ? 'is' : 'are'} waiting for you! ${followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)]}`,
                  `Superb! ${itemText} ${itemNames.length === 1 ? 'has' : 'have'} been added to your cart. Ready to complete your order! ${followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)]}`,
                  `Nice selection! I've placed ${itemText} in your cart. ${itemNames.length === 1 ? 'It' : 'They'} ${itemNames.length === 1 ? 'is' : 'are'} all set for checkout! ${followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)]}`,
                  `Wonderful! ${itemText} ${itemNames.length === 1 ? 'is' : 'are'} now in your cart. ${itemNames.length === 1 ? 'It' : 'They'} ${itemNames.length === 1 ? 'is' : 'are'} ready when you are! ${followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)]}`,
                ];
                
                // Randomly select a message variation
                const randomMessage = messageVariations[Math.floor(Math.random() * messageVariations.length)];
                resposnseMessage.content = randomMessage;
              }
            } else {
              // Process orders even if no new items (to update the hash)
            processOrdersFromMemory(orderItems, fullResponse);
          }
        }
        }
        
        // Handle informational queries when API returns empty content and no orders
        let isInformationalQuery = false;
        
        if ((!resposnseMessage.content || resposnseMessage.content.trim() === '') && !hasOrders) {
          
          let handled = false;
          
          // Check if it's a recommendation query
          if (isRecommendationQuery(message)) {
            resposnseMessage.content = generateRecommendationResponse(products);
            handled = true;
            isInformationalQuery = true;
          }
          // Check if it's a price query
          else if (isPriceQuery(message)) {
            const product = extractProductNameFromQuery(message, products);
            if (product) {
              resposnseMessage.content = generatePriceResponse(product);
              handled = true;
              isInformationalQuery = true;
            } else {
              resposnseMessage.content = "I'd be happy to help you with pricing! Could you please specify which item you'd like to know the price of?";
              handled = true;
              isInformationalQuery = true;
            }
          }
          // If it's an order request but no orders were found, try to match the product
          else if (message.toLowerCase().includes('order') || message.toLowerCase().includes('add') || message.toLowerCase().includes('like to')) {
            const product = extractProductNameFromQuery(message, products);
            if (product) {
              // Check if item is already in cart to prevent duplicates
              const itemKey = `${product.id}-1`;
              const isAlreadyInCart = cartItems.some(item => 
                item.product.id === product.id && item.quantity >= 1
              );
              const isAlreadyProcessed = processedOrders.has(itemKey);
              
              // Only add if not already in cart and not already processed
              if (!isAlreadyInCart && !isAlreadyProcessed) {
                // Try to add the product to cart
                addToCart(product, 1, true);
                // Mark as processed to prevent duplicate additions
                setProcessedOrders(prev => new Set(prev).add(itemKey));
                
                const description = product.description ? ` ${product.description}` : '';
                const orderResponses = [
                  // 2-line messages
                  `✅ Added: **${product.name}**\n💰 Price: $${product.price.toFixed(2)}${description}\n\nAnything else?`,
                  `**${product.name}** → Cart ✓\n$${product.price.toFixed(2)}${description}\n\nWhat's next?`,
                  `✓ **${product.name}** added\n$${product.price.toFixed(2)}${description}\n\nNeed anything else?`,
                  `**${product.name}** ✓\n$${product.price.toFixed(2)}${description}\n\nAnything else?`,
                  
                  // 3-line messages
                  `Done! ${product.name} is in your cart.${description}\n\nPrice: $${product.price.toFixed(2)}\n\nAdd more?`,
                  `Cart updated:\n• ${product.name} - $${product.price.toFixed(2)}${description}\n\nWhat else?`,
                  `Added to cart:\n**${product.name}** | $${product.price.toFixed(2)}${description}\n\nMore items?`,
                  `✅ ${product.name}\n$${product.price.toFixed(2)}${description}\n\nAdd more?`,
                  
                  // 4-line messages
                  `**${product.name}** is now in your cart.${description}\n\nPrice: $${product.price.toFixed(2)}\n\nWhat else?\n\nReady for checkout when you are!`,
                  `→ ${product.name} added\n$${product.price.toFixed(2)}${description}\n\nNeed anything else?\n\nYour order is taking shape!`,
                  `Cart: **${product.name}** ✓\n$${product.price.toFixed(2)}${description}\n\nWhat's next?\n\nI'm here if you need more!`,
                  `**${product.name}** → $${product.price.toFixed(2)}${description}\n\nAdded! More items?\n\nYour cart is looking good!`,
                  
                  // 5-line messages
                  `✓ Added **${product.name}**\n$${product.price.toFixed(2)}${description}\n\nAnything else?\n\nIt's all set and ready.\n\nWhat would you like next?`,
                  `**${product.name}** is ready!${description}\n\n$${product.price.toFixed(2)}\n\nAdd more?\n\nYour selection is perfect.\n\nNeed anything else?`,
                  `Cart updated with **${product.name}**\n$${product.price.toFixed(2)}${description}\n\nWhat else?\n\nIt's ready for checkout.\n\nWant to add more items?`,
                  `**${product.name}** ✓ $${product.price.toFixed(2)}${description}\n\nNeed anything else?\n\nYour cart is ready.\n\nI can help you add more.\n\nWhat would you like?`,
                ];
                resposnseMessage.content = orderResponses[Math.floor(Math.random() * orderResponses.length)];
                handled = true;
                isInformationalQuery = true;
              }
              // If already in cart or processed, don't add and don't show message - just skip silently
            }
          }
          
          // Final fallback if none of the above matched
          if (!handled && (!resposnseMessage.content || resposnseMessage.content.trim() === '')) {
            resposnseMessage.content = "I'm sorry, I didn't catch that. Could you please elaborate?";
          }
        }
        
        // Add delay to simulate API processing time
        // Longer delay (5-7 seconds) for informational queries to make it feel more natural
        // Shorter delay (0.5-1 second) for regular API responses
        const delay = isInformationalQuery 
          ? Math.random() * 2000 + 5000 // 5 to 7 seconds for informational queries
          : Math.random() * 500 + 500;   // 0.5 to 1 second for regular responses
        
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prevMessages => [...prevMessages, resposnseMessage]);
        }, delay);
        
        // Optional: Speak the bot's response
        // Uncomment the line below to enable text-to-speech
        // speakText(resposnseMessage.content);
        
    } catch(err: any) {
        setIsTyping(false);
        const errorMessage = err.response?.data?.error || err.message || 'Error sending message';
        toast.error(errorMessage);
        
        // Add error message to chat
        const errorResponse: MessageInterface = {
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again or check your connection."
        };
        setMessages(prevMessages => [...prevMessages, errorResponse]);
    } finally {
        setIsSending(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex-1 bg-white flex flex-col relative overflow-hidden min-h-0`}>
        {/* Animated Background Elements - only show in full screen */}
        {!isWidget && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-neutral-200/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute top-40 right-20 w-40 h-40 bg-neutral-200/10 rounded-full blur-3xl animate-float-delayed"></div>
            <div className="absolute bottom-40 left-1/4 w-36 h-36 bg-neutral-200/10 rounded-full blur-3xl animate-float-slow"></div>
          </div>
        )}

        {/* Header - only show in full screen mode when not in widget full-screen */}
        {!isWidget && !isFullScreen && (
          <>
            <div className='bg-white/80 backdrop-blur-md border-b border-neutral-200 shadow-lg relative z-10'>
              <div className='max-w-4xl mx-auto px-4 py-5'>
                <div className='flex items-center gap-3'>
                  <div className='relative'>
                    <div className='w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center shadow-lg overflow-hidden'>
                      <img 
                        src={chatbotImage} 
                        alt="Merry's Way Coffee Shop" 
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <div className='absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white'></div>
                  </div>
                  <div>
                    <h1 className='text-2xl font-bold text-neutral-900 flex items-center gap-2'>
                      <span>Merry's Way</span>
                    </h1>
                    <p className='text-base text-neutral-600 mt-0.5'>
                      Your Coffee Assistant
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className='h-1 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 relative z-10'>
              <div className='h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer'></div>
            </div>
          </>
        )}

        <div className='flex-1 flex flex-col relative z-10 min-h-0'>
            <div className='flex-1 min-h-0 overflow-hidden'>
                <MessageList 
                    messages={messages}
                    isTyping={isTyping}
                />
            </div>

            <div className={`pt-3 sm:pt-4 pb-3 sm:pb-4 md:pb-5 px-2 sm:px-3 md:px-4 bg-white/80 backdrop-blur-md border-t border-neutral-200 shadow-lg flex-shrink-0 z-20 ${isWidget ? '' : ''}`}>
                <div className={`${isWidget ? 'px-1 sm:px-2' : 'max-w-4xl mx-auto'}`}>
                  <div className="flex flex-row justify-between items-center border-2 p-2 sm:p-2.5 md:p-3 bg-white/90 backdrop-blur-sm border-neutral-300 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:border-neutral-400 group">
                      <input 
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder={isFullScreen ? 'Ask me anything...' : 'Ask me anything about our coffee shop...'}
                          className='flex-1 mr-1.5 sm:mr-2 outline-none text-sm sm:text-base bg-transparent text-neutral-700 placeholder:text-neutral-400 focus:placeholder:text-neutral-500 transition-colors'
                          disabled={isSending || isListening}
                      />
                      {isSupported && (
                        <button
                          onClick={toggleVoiceRecording}
                          disabled={isSending}
                          className={`p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 mr-1.5 sm:mr-2 ${
                            isListening
                              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                              : 'bg-neutral-200 hover:bg-neutral-300'
                          } ${isSending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          aria-label={isListening ? 'Stop recording' : 'Start voice recording'}
                        >
                          {isListening ? (
                            <FiMicOff size={18} color="#FFFFFF" />
                          ) : (
                            <FiMic size={18} color="#6B7280" />
                          )}
                        </button>
                      )}
                      <button
                          onClick={() => handleSendMessage()}
                          disabled={isSending || !inputValue.trim() || isListening}
                          className={`p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 ${
                            isSending || !inputValue.trim() || isListening
                              ? 'bg-neutral-200 cursor-not-allowed'
                              : 'bg-neutral-800 hover:bg-neutral-900 active:scale-95 cursor-pointer shadow-md hover:shadow-lg group-hover:scale-105'
                          }`}
                          aria-label={
                            isSending 
                              ? 'Sending message' 
                              : !inputValue.trim() 
                              ? 'Send message (disabled: no text entered)' 
                              : isListening 
                              ? 'Send message (disabled: voice recording in progress)' 
                              : 'Send message'
                          }
                      >
                          <FiSend 
                            size={18} 
                            color={isSending || !inputValue.trim() || isListening ? "#9CA3AF" : "#FFFFFF"}
                            aria-hidden="true"
                          />
                      </button>
                  </div>
                  {isListening && (
                    <div className="flex items-center gap-2 mt-2 sm:mt-3 ml-1 sm:ml-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></div>
                      </div>
                      <p className="text-xs sm:text-sm text-red-600 font-medium">Listening... Speak now</p>
                    </div>
                  )}
                  {isSending && (
                    <div className="flex items-center gap-2 mt-2 sm:mt-3 ml-1 sm:ml-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-500">Sending your message...</p>
                    </div>
                  )}
                </div>
            </div>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
          }}
          total={getTotalPrice() * 1.1}
          onPaymentSuccess={handlePaymentSuccess}
          cartItems={cartItems}
        />
    </div>
  )
}

export default ChatRoom

