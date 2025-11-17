
import { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, Trash2, UserPlus, Video } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Avatar, AvatarFallback } from './ui/avatar';
import { authService } from '../services/AuthService';
import { config } from '../utils/config';

interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  addedAt: string;
}

interface ContactsPageProps {
  onStartCall: (contactId?: string) => void;
  language: 'en' | 'te';
}

interface NewContact {
  name: string;
  email: string;
  phone: string;
}

export function ContactsPage({ onStartCall, language }: ContactsPageProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState<NewContact>({ name: '', email: '', phone: '' });
  const [error, setError] = useState<string | null>(null);

  const translations = {
    en: {
      contacts: "Contacts",
      addContact: "Add Contact",
      searchContacts: "Search contacts...",
      name: "Name",
      email: "Email",
      phone: "Phone (optional)",
      add: "Add",
      cancel: "Cancel",
      call: "Call",
      delete: "Delete",
      noContacts: "No contacts found",
      addFirstContact: "Add your first contact to get started",
      contactAdded: "Contact added successfully",
      errorFetching: "Error fetching contacts",
      errorAdding: "Error adding contact",
      errorDeleting: "Error deleting contact"
    },
    te: {
      contacts: "పరిచయాలు",
      addContact: "పరిచయం జోడించండి",
      searchContacts: "పరిచయాలను వెతకండి...",
      name: "పేరు",
      email: "ఇమెయిల్",
      phone: "ఫోన్ (ఐచ్ఛికం)",
      add: "జోడించండి",
      cancel: "రద్దు చేయండి",
      call: "కాల్ చేయండి",
      delete: "తొలగించండి",
      noContacts: "పరిచయాలు కనుగొనబడలేదు",
      addFirstContact: "ప్రారంభించడానికి మీ మొదటి పరిచయాన్ని జోడించండి",
      contactAdded: "పరిచయం విజయవంతంగా జోడించబడింది",
      errorFetching: "పరిచయాలను పొందడంలో లోపం",
      errorAdding: "పరిచయాన్ని జోడించడంలో లోపం",
      errorDeleting: "పరిచయాన్ని తొలగించడంలో లోపం"
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = authService.getAccessToken();
      if (!token) {
        setError(t.errorFetching);
        setContacts([]);
        setLoading(false);
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/api/contacts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        setError(t.errorFetching);
        setContacts([]);
        return;
      }

      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      setError(t.errorFetching);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    if (!newContact.name || !newContact.email) return;

    setError(null);
    try {
      const token = authService.getAccessToken();
      if (!token) {
        setError(t.errorAdding);
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newContact)
      });

      if (!response.ok) {
        setError(t.errorAdding);
        return;
      }

      const data = await response.json();
      setContacts([...contacts, data.contact]);
      setNewContact({ name: '', email: '', phone: '' });
      setIsAddDialogOpen(false);
    } catch (error) {
      setError(t.errorAdding);
    }
  };

  const deleteContact = async (contactId: string) => {
    setError(null);
    try {
      const token = authService.getAccessToken();
      if (!token) {
        setError(t.errorDeleting);
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/api/contacts/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        setError(t.errorDeleting);
        return;
      }

      setContacts(contacts.filter(c => c._id !== contactId));
    } catch (error) {
      setError(t.errorDeleting);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{t.contacts}</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              {t.addContact}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.addContact}</DialogTitle>
              <DialogDescription>
                Fill in the contact details to add them to your contacts list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t.name}</Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder={t.name}
                />
              </div>
              <div>
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder={t.email}
                />
              </div>
              <div>
                <Label htmlFor="phone">{t.phone}</Label>
                <Input
                  id="phone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder={t.phone}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {t.cancel}
                </Button>
                <Button onClick={addContact} disabled={!newContact.name || !newContact.email}>
                  {t.add}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          className="pl-10"
          placeholder={t.searchContacts}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && (
        <div className="text-red-600 text-center mt-2">
          {error}
        </div>
      )}

      {filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t.noContacts}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {t.addFirstContact}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredContacts.map((contact) => (
            <Card key={contact._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {contact.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {contact.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {contact.email}
                        </div>
                        {contact.phone && (
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => onStartCall(contact._id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Video className="h-4 w-4 mr-1" />
                      {t.call}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteContact(contact._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
